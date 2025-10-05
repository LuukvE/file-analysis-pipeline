import { DynamoDB } from 'shared/dynamodb';
import { Provider } from '@nestjs/common';

export const DB_PROVIDER = 'DB_PROVIDER';

export const dbProvider: Provider = {
  provide: DB_PROVIDER,
  useFactory: () => {
    const db = new DynamoDB();

    return db;
  }
};
