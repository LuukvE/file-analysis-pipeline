import { EventEmitter } from 'events';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  DescribeStreamCommand,
  DynamoDBStreamsClient,
  GetRecordsCommand,
  GetShardIteratorCommand
} from '@aws-sdk/client-dynamodb-streams';

import { Job, Result } from './types';
import { encrypt } from './crypto';

const discovery = { start: new Date() };
const shards: Record<string, string> = {};
const updateDates: Record<string, Date> = {};
const client = new DynamoDBClient({ region: 'eu-west-1' });
const streams = new DynamoDBStreamsClient({ region: 'eu-west-1' });
const db = DynamoDBDocumentClient.from(client);

export const database = new EventEmitter<{
  change: [job: Job];
  take: [job: Job, processor: string];
  result: [job: Job, payload: string];
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

database.on('result', async (job, payload) => {
  const Item: Result = {
    id: `result-${crypto.randomUUID()}`,
    client: job.client,
    payload: encrypt(job.client.substring(7), payload)
  };

  console.log('result', Item);

  const command = new PutCommand({ TableName: 'results', Item });

  await db.send(command);
});

discover();

cleanup();

async function discover(ParentShardId?: string) {
  try {
    const { Table } = await client.send(new DescribeTableCommand({ TableName: 'jobs' }));

    const { StreamDescription } = await streams.send(
      new DescribeStreamCommand({
        StreamArn: Table.LatestStreamArn,
        ShardFilter: ParentShardId ? { Type: 'CHILD_SHARDS', ShardId: ParentShardId } : undefined
      })
    );

    await Promise.all(
      StreamDescription.Shards.map(async function getIterator({ ShardId }) {
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
      })
    );
  } catch (err) {
    console.error(err);

    setTimeout(discover, 1000);
  }
}

async function poll(ShardId: string) {
  try {
    const { Records, NextShardIterator } = await streams.send(
      new GetRecordsCommand({ ShardIterator: shards[ShardId] })
    );

    setImmediate(() => {
      const records = Records.reduce((grouped: Record<string, unknown>, record) => {
        if (!record.dynamodb?.NewImage) return grouped;

        try {
          const job = unmarshall(record.dynamodb.NewImage);

          if (!job.id) return grouped;

          if (discovery.start > record.dynamodb.ApproximateCreationDateTime) return grouped;

          // TODO: Handle same-milisecond updates better
          if (updateDates[job.id] > record.dynamodb.ApproximateCreationDateTime) return grouped;

          updateDates[job.id] = record.dynamodb.ApproximateCreationDateTime;

          grouped[job.id] = job;
        } catch (err) {
          console.error('malformed DB image', record.dynamodb.NewImage, err);
        }

        return grouped;
      }, {});

      const jobs = Object.values(records);

      if (!jobs.length) return;

      console.log(jobs);

      Object.values(jobs).forEach((job: Job) => database.emit('change', job));
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

function cleanup() {
  setTimeout(cleanup, 3600000); // hourly loop

  // TRIM_HORIZON is 24 hours, we remove only dates that exceed that time + some margin
  const twentyFiveHoursAgo = new Date(Date.now() - 90000000);

  Object.entries(updateDates).map(([id, date]) => {
    if (date < twentyFiveHoursAgo) delete updateDates[id];
  });
}
