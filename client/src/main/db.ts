import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Job, Status } from './types';

const TableName = 'jobs';
const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const createJob = async (job: Job) => {
  const command = new PutCommand({
    TableName,
    Item: job
  });

  await docClient.send(command);
};

export const updateJob = async (id: string, chunks: number) => {
  const command = new UpdateCommand({
    TableName,
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
      ':uploaded': new Date().toJSON()
    }
  });

  await docClient.send(command);
};
