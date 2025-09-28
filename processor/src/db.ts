import { EventEmitter } from 'events';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DescribeStreamCommand,
  DynamoDBStreamsClient,
  GetRecordsCommand,
  GetShardIteratorCommand
} from '@aws-sdk/client-dynamodb-streams';

import { Job } from './types';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const discovery = { busy: false };
const shards: Record<string, string> = {};
const client = new DynamoDBClient({ region: 'eu-west-1' });
const streams = new DynamoDBStreamsClient({ region: 'eu-west-1' });
const db = DynamoDBDocumentClient.from(client);

discover();

export const database = new EventEmitter<{
  change: [job: Job];
  take: [job: Job, processor: string];
}>();

database.on('take', (job, processor) => {
  const command = new UpdateCommand({
    TableName: 'jobs',
    Key: { id: job.id },
    UpdateExpression: 'SET #processor = :processor',
    ConditionExpression: 'attribute_not_exists(processor)', // avoids race conditions during uploading
    ExpressionAttributeNames: { '#processor': 'processor' },
    ExpressionAttributeValues: { ':processor': processor }
  });

  db.send(command).catch((err: Error) => {
    // this type of exception is expected
    if (err.name !== 'ConditionalCheckFailedException') throw err;
  });
});

async function discover(ParentShardId?: string) {
  if (discovery.busy) return;

  discovery.busy = true;

  try {
    const { Table } = await client.send(new DescribeTableCommand({ TableName: 'jobs' }));

    const { StreamDescription } = await streams.send(
      new DescribeStreamCommand({
        StreamArn: Table.LatestStreamArn,
        ShardFilter: ParentShardId ? { Type: 'CHILD_SHARDS', ShardId: ParentShardId } : undefined
      })
    );

    discovery.busy = false;

    StreamDescription.Shards.forEach(async function getIterator({ ShardId }) {
      if (shards[ShardId]) return;

      const ShardIteratorType = ParentShardId ? 'TRIM_HORIZON' : 'LATEST';

      try {
        const { ShardIterator } = await streams.send(
          new GetShardIteratorCommand({
            ShardId,
            ShardIteratorType,
            StreamArn: Table.LatestStreamArn
          })
        );

        shards[ShardId] = ShardIterator;

        poll(ShardId);
      } catch (err) {
        console.error(err);

        setTimeout(getIterator, 1000, { ShardId });
      }
    });
  } catch (err) {
    console.error(err);

    discovery.busy = false;

    setTimeout(discover, 1000);
  }
}

async function poll(ShardId: string) {
  try {
    const { Records, NextShardIterator } = await streams.send(
      new GetRecordsCommand({ ShardIterator: shards[ShardId] })
    );

    setImmediate(() => {
      Records.forEach((record) => {
        if (!record.dynamodb?.NewImage) return;

        try {
          database.emit('change', unmarshall(record.dynamodb.NewImage) as Job);
        } catch (err) {
          console.error('malformed DB image', record.dynamodb.NewImage, err);
        }
      });
    });

    if (NextShardIterator) {
      shards[ShardId] = NextShardIterator;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      return poll(ShardId);
    }

    delete shards[ShardId];

    discover(ShardId);
  } catch (err) {
    console.error(err);

    setTimeout(poll, 1000, ShardId);
  }
}
