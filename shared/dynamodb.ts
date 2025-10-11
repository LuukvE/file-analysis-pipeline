import { EventEmitter } from 'events';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  DescribeStreamCommand,
  DynamoDBStreamsClient,
  GetRecordsCommand,
  GetRecordsCommandOutput,
  GetShardIteratorCommand,
  ShardFilterType
} from '@aws-sdk/client-dynamodb-streams';

import { Message } from './types';

export class Stream<T extends { id: string } = any> {
  db: DynamoDB;
  table: string;
  destroyed = false;
  pollingSpeed: 1000;
  start: Date = new Date();
  cleanupTimeout: NodeJS.Timeout;
  memory: Record<string, Date> = {};
  shards: Record<string, string> = {};
  listener: (item: T, date: Date) => void;

  constructor(db: DynamoDB, table: string, listener: (item: T, date: Date) => void) {
    this.db = db;
    this.table = table;
    this.listener = listener;

    this.discover();
    this.cleanup();
  }

  async discover(ParentShardId?: string) {
    if (this.destroyed) return;

    try {
      const tableCommand = new DescribeTableCommand({ TableName: this.table });
      const { Table } = await this.db.client.send(tableCommand);
      const StreamArn = Table.LatestStreamArn;
      const filter = { Type: ShardFilterType.CHILD_SHARDS, ShardId: ParentShardId };
      const ShardFilter = ParentShardId ? filter : undefined;
      const streamCommand = new DescribeStreamCommand({ StreamArn, ShardFilter });
      const { StreamDescription } = await this.db.streamsClient.send(streamCommand);

      StreamDescription.Shards.forEach(({ ShardId }) =>
        this.getIterator(ShardId, ParentShardId, Table.LatestStreamArn)
      );
    } catch (err) {
      console.error(err);

      setTimeout(() => this.discover(ParentShardId), this.pollingSpeed);
    }
  }

  async getIterator(ShardId: string, ParentShardId: string, StreamArn: string) {
    if (this.destroyed) return;

    if (this.shards[ShardId]) return;

    const ShardIteratorType = ParentShardId ? 'TRIM_HORIZON' : 'LATEST';
    const iteratorCommand = new GetShardIteratorCommand({ ShardId, ShardIteratorType, StreamArn });

    try {
      const { ShardIterator } = await this.db.streamsClient.send(iteratorCommand);

      this.shards[ShardId] = ShardIterator;

      this.poll(ShardId);
    } catch (err) {
      console.error(err);

      setTimeout(() => this.getIterator(ShardId, ParentShardId, StreamArn), this.pollingSpeed);
    }
  }

  async poll(ShardId: string) {
    try {
      const recordsCommand = new GetRecordsCommand({ ShardIterator: this.shards[ShardId] });
      const { Records, NextShardIterator } = await this.db.streamsClient.send(recordsCommand);

      setImmediate(() => this.processRecords(Records));

      if (NextShardIterator) {
        this.shards[ShardId] = NextShardIterator;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        return this.poll(ShardId);
      }

      delete this.shards[ShardId];

      this.discover(ShardId);
    } catch (err) {
      console.error(err);

      setTimeout(() => this.poll(ShardId), 1000);
    }
  }

  processRecords(records: GetRecordsCommandOutput['Records']) {
    const grouped = records.reduce((grouped: Record<string, unknown>, record) => {
      if (!record.dynamodb?.NewImage) return grouped;

      try {
        const item = unmarshall(record.dynamodb.NewImage);

        if (!item.id) return grouped;

        if (this.start > record.dynamodb.ApproximateCreationDateTime) return grouped;

        // TODO: Handle same-milisecond updates better
        if (this.memory[item.id] > record.dynamodb.ApproximateCreationDateTime) return grouped;

        this.memory[item.id] = record.dynamodb.ApproximateCreationDateTime;

        grouped[item.id] = item;
      } catch (err) {
        console.error('malformed DB image', record.dynamodb.NewImage, err);
      }

      return grouped;
    }, {});

    const items = Object.values(grouped);

    if (!items.length) return;

    Object.values(items).forEach((item: T) => this.listener(item, this.memory[item.id]));
  }

  cleanup() {
    this.cleanupTimeout = setTimeout(() => this.cleanup(), 3600000); // hourly loop

    // TRIM_HORIZON is 24 hours, we remove only dates that exceed that time + some margin
    const twentyFiveHoursAgo = new Date(Date.now() - 90000000);

    Object.entries(this.memory).map(([id, date]) => {
      if (date < twentyFiveHoursAgo) delete this.memory[id];
    });
  }

  destroy() {
    if (this.cleanupTimeout) clearTimeout(this.cleanupTimeout);

    this.destroyed = true;
  }
}

export class DynamoDB extends EventEmitter {
  region: string;
  streams: Stream[] = [];
  client: DynamoDBClient;
  streamsClient: DynamoDBStreamsClient;
  documentClient: DynamoDBDocumentClient;

  constructor(region: string = 'eu-west-1') {
    super();

    this.client = new DynamoDBClient({ region });
    this.streamsClient = new DynamoDBStreamsClient({ region });
    this.documentClient = DynamoDBDocumentClient.from(this.client);

    this.on('newListener', (event, listener) => {
      const [name, table] = event.toString().split(':');

      if (name !== 'change' || !table) return;

      const stream = new Stream(this, table, listener);

      this.streams.push(stream);
    });

    this.on('removeListener', (event: string | symbol, listener: (...args: any[]) => void) => {
      const [name, table] = event.toString().split(':');

      if (name !== 'change' || !table) return;

      const index = this.streams.findIndex((stream) => stream.listener === listener);

      if (index === -1) return;

      const [stream] = this.streams.splice(index, 1);

      stream.destroy();
    });
  }

  update<T extends { id: string } = any>(item: T, table: string, condition?: string) {
    type Memo = {
      expressions: string[];
      names: Record<string, string>;
      values: Record<string, string>;
    };

    const memo = Object.entries(item).reduce(
      (memo: Memo, [key, value]) => {
        if (key === 'id') return memo;

        memo.names[`#${key}`] = key;
        memo.values[`:${key}`] = value;
        memo.expressions.push(`#${key} = :${key}`);

        return memo;
      },
      { expressions: [], names: {}, values: {} }
    );

    const command = new UpdateCommand({
      TableName: table,
      Key: { id: item.id },
      UpdateExpression: `SET ${memo.expressions.join(', ')}`,
      ConditionExpression: condition,
      ExpressionAttributeNames: memo.names,
      ExpressionAttributeValues: memo.values
    });

    return this.documentClient.send(command);
  }

  create<T extends Message = any>(Item: T, TableName: string) {
    const command = new PutCommand({ TableName, Item });

    return this.documentClient.send(command);
  }
}
