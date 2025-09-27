import { app } from 'electron';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { sign } from './crypto';
import { Job, Status } from './types';
import { privateKey, publicKey } from './settings';

const TableName = 'jobs';
const created: Record<string, Date> = {};
const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const setJob = async (id: string, file: string, bucket: string, region: string) => {
  created[id] = new Date();

  const job: Job = {
    id,
    version: app.getVersion(),
    created: created[id].toJSON(),
    bucket,
    region,
    file,
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

  const command = new PutCommand({ TableName, Item });

  await docClient.send(command);
};

export const setChunks = async (id: string, index: number) => {
  console.log(`Chunk #${index + 1}`);

  const command = new UpdateCommand({
    TableName,
    Key: { id },
    UpdateExpression: 'SET #chunks = :chunks',
    ConditionExpression: '#chunks < :chunks', // avoids race conditions during uploading
    ExpressionAttributeNames: { '#chunks': 'chunks' },
    ExpressionAttributeValues: { ':chunks': index + 1 }
  });

  await docClient.send(command).catch((err: Error) => {
    // this type of exception is by design
    if (err.name !== 'ConditionalCheckFailedException') throw err;
  });
};

export const setUploaded = async (id: string) => {
  const uploaded = new Date();
  const duration = uploaded.valueOf() - new Date(created[id]).valueOf();

  console.log('Duration', new Intl.NumberFormat().format(duration), 'ms');

  const command = new UpdateCommand({
    TableName,
    Key: { id },
    UpdateExpression: 'SET #status = :status, #uploaded = :uploaded',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#uploaded': 'uploaded'
    },
    ExpressionAttributeValues: {
      ':status': Status.UPLOADED,
      ':uploaded': uploaded.toJSON()
    }
  });

  await docClient.send(command);
};
