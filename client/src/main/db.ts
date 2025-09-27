import { app } from 'electron';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { Job, Status } from './types';
import { publicKey } from './settings';

const TableName = 'jobs';
const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const createJob = async (id: string, file: string, bucket: string, region: string) => {
  const Item: Job = {
    id,
    status: Status.UPLOADING,
    version: app.getVersion(),
    created: new Date().toJSON(),
    bucket,
    region,
    file,
    client: `client-${publicKey}`
  };

  const command = new PutCommand({ TableName, Item });

  await docClient.send(command);
};

export const updateJob = async (id: string, chunks: number, status: Status) => {
  const command = new UpdateCommand({
    TableName,
    Key: { id },
    UpdateExpression: 'SET #status = :status, #chunks = :chunks, #uploaded = :uploaded',
    ConditionExpression: '#chunks < :chunks', // avoids race conditions during uploading
    ExpressionAttributeNames: {
      '#status': 'status',
      '#chunks': 'chunks',
      '#uploaded': 'uploaded'
    },
    ExpressionAttributeValues: {
      ':status': Status.UPLOADED,
      ':chunks': chunks,
      ':uploaded': new Date().toJSON()
    }
  });

  await docClient.send(command);
};
