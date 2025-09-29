import { app } from 'electron';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { sign } from './crypto';
import { Job, Status } from './types';
import { privateKey, publicKey } from './settings';

const created: Record<string, Date> = {};
const client = new DynamoDBClient({ region: 'eu-west-1' });
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
