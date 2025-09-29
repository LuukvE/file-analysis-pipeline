import { app } from 'electron';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  DescribeStreamCommand,
  DynamoDBStreamsClient,
  GetRecordsCommand,
  GetShardIteratorCommand
} from '@aws-sdk/client-dynamodb-streams';

import { decrypt, sign } from './crypto';
import { Job, Result, Status } from './types';
import { privateKey, publicKey } from './settings';

const discovery = { start: new Date() };
const shards: Record<string, string> = {};
const updateDates: Record<string, Date> = {};
const created: Record<string, Date> = {};
const client = new DynamoDBClient({ region: 'eu-west-1' });
const streams = new DynamoDBStreamsClient({ region: 'eu-west-1' });
const db = DynamoDBDocumentClient.from(client);

export const setJob = async (
  id: string,
  file: string,
  mime: string,
  bucket: string,
  region: string
) => {
  created[id] = new Date();

  const job: Job = {
    id,
    version: app.getVersion(),
    created: created[id].toJSON(),
    bucket,
    region,
    file,
    mime,
    client: `client-${publicKey}`
  };

  const Item: Job = {
    ...job,
    signature: sign(privateKey, publicKey, JSON.stringify(job)),
    status: Status.UPLOADING,
    chunks: 1
  };

  console.log('Created', id);
  console.log(`Chunk #1`);

  const command = new PutCommand({ TableName: 'jobs', Item });

  await db.send(command);
};

export const setChunks = async (id: string, index: number) => {
  console.log(`Chunk #${index + 1}`);

  const command = new UpdateCommand({
    TableName: 'jobs',
    Key: { id },
    UpdateExpression: 'SET #chunks = :chunks',
    ConditionExpression: '#chunks < :chunks', // avoids race conditions during uploading
    ExpressionAttributeNames: { '#chunks': 'chunks' },
    ExpressionAttributeValues: { ':chunks': index + 1 }
  });

  await db.send(command).catch((err: Error) => {
    // this type of exception is by design
    if (err.name !== 'ConditionalCheckFailedException') throw err;
  });
};

export const setUploaded = async (id: string, chunks: number) => {
  const uploaded = new Date();
  const duration = uploaded.valueOf() - new Date(created[id]).valueOf();

  console.log('Duration', new Intl.NumberFormat().format(duration), 'ms');

  const command = new UpdateCommand({
    TableName: 'jobs',
    Key: { id },
    UpdateExpression: 'SET #status = :status, #chunks = :chunks, #uploaded = :uploaded',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#chunks': 'chunks',
      '#uploaded': 'uploaded'
    },
    ExpressionAttributeValues: {
      ':status': Status.UPLOADED,
      ':chunks': chunks,
      ':uploaded': uploaded.toJSON()
    }
  });

  await db.send(command);
};

discover();

cleanup();

async function discover(ParentShardId?: string) {
  try {
    const { Table } = await client.send(new DescribeTableCommand({ TableName: 'results' }));

    if (!Table) throw 'Table not found';

    const { StreamDescription } = await streams.send(
      new DescribeStreamCommand({
        StreamArn: Table.LatestStreamArn,
        ShardFilter: ParentShardId ? { Type: 'CHILD_SHARDS', ShardId: ParentShardId } : undefined
      })
    );

    await Promise.all(
      StreamDescription!.Shards!.map(async function getIterator({ ShardId }) {
        if (!ShardId || shards[ShardId]) return;

        const ShardIteratorType = ParentShardId ? 'TRIM_HORIZON' : 'LATEST';

        try {
          const { ShardIterator } = await streams.send(
            new GetShardIteratorCommand({
              ShardId,
              ShardIteratorType,
              StreamArn: Table.LatestStreamArn
            })
          );

          if (!ShardIterator) return;

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

    if (!Records) throw 'No DynamoDB Records';

    setImmediate(() => {
      const records = Records.reduce((grouped: Record<string, unknown>, record) => {
        if (!record.dynamodb?.NewImage) return grouped;

        try {
          const result = unmarshall(record.dynamodb.NewImage);

          if (!result.id || !record.dynamodb.ApproximateCreationDateTime) return grouped;

          if (discovery.start > record.dynamodb.ApproximateCreationDateTime) return grouped;

          if (updateDates[result.id] >= record.dynamodb.ApproximateCreationDateTime) return grouped;

          updateDates[result.id] = record.dynamodb.ApproximateCreationDateTime;

          grouped[result.id] = result;
        } catch (err) {
          console.error('malformed DB image', record.dynamodb.NewImage, err);
        }

        return grouped;
      }, {});

      const results = Object.values(records) as Result[];

      if (!results.length) return;

      console.log(`%s: DB results:${results.length}`, new Date().toJSON());

      Object.values(results).forEach((result) => {
        console.log('Engine Result:', decrypt(privateKey, result.payload));
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

function cleanup() {
  setTimeout(cleanup, 3600000); // hourly loop

  // TRIM_HORIZON is 24 hours, we remove only dates that exceed that time + some margin
  const twentyFiveHoursAgo = new Date(Date.now() - 90000000);

  Object.entries(updateDates).map(([id, date]) => {
    if (date < twentyFiveHoursAgo) delete updateDates[id];
  });
}
