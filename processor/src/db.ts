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

export const jobs = new EventEmitter<{ change: [data: Job] }>();

const discovery = { busy: false };
const shards: Record<string, string> = {};
const db = new DynamoDBClient({ region: 'eu-west-1' });
const streams = new DynamoDBStreamsClient({ region: 'eu-west-1' });

discover();

async function discover() {
  if (discovery.busy) return;

  discovery.busy = true;

  try {
    const isStartup = !Object.keys(shards).length;
    const { Table } = await db.send(new DescribeTableCommand({ TableName: 'jobs' }));
    const input = { StreamArn: Table.LatestStreamArn };
    const { StreamDescription } = await streams.send(new DescribeStreamCommand(input));

    discovery.busy = false;

    StreamDescription.Shards.forEach(async function getIterator({ ShardId }) {
      if (shards[ShardId]) return;

      const ShardIteratorType = isStartup ? 'LATEST' : 'TRIM_HORIZON';

      const getShard = new GetShardIteratorCommand({
        ShardId,
        ShardIteratorType,
        StreamArn: Table.LatestStreamArn
      });

      try {
        const { ShardIterator } = await streams.send(getShard);

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
          jobs.emit('change', unmarshall(record.dynamodb.NewImage) as Job);
        } catch (err) {
          console.error('malformed DB image', record.dynamodb.NewImage);
        }
      });
    });

    if (NextShardIterator) {
      shards[ShardId] = NextShardIterator;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      return poll(ShardId);
    }
  } catch (err) {
    console.error(err);

    return setTimeout(poll, 1000, ShardId);
  }

  delete shards[ShardId];

  discover();
}
