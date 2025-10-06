import { app } from 'electron';
import { lookup } from 'mime-types';
import WebSocket, { type Data } from 'ws';
import { MessageEvent, Table, type Chunk, type Job, type Message } from 'shared/types';

import { publicKey } from './settings';

const ws = new WebSocket('ws://localhost:8080');

ws.on('message', (data: Data) => {
  try {
    const message = JSON.parse(data.toString('utf-8')) as Message;

    ws.emit('incoming', message);
  } catch (e) {
    console.log(e);
  }
});

ws.on('error', (error: Error) => console.error(error));

export async function createChunk(n: number) {
  const payload: Partial<Chunk> = { chunk: n };
  const message = await send({ event: MessageEvent.CREATE, table: Table.CHUNKS, payload });

  return message.payload as Chunk;
}

export async function updateJob(payload: Partial<Job>) {
  const message = await send({ event: MessageEvent.UPDATE, table: Table.JOBS, payload });

  return message.payload as Job;
}

export async function createJob(path: string): Promise<Job> {
  const mime = lookup(path) || 'application/octet-stream';

  const payload: Job = {
    id: '',
    version: app.getVersion(),
    created: new Date().toJSON(),
    bucket: 'bucket-file-analysis-pipeline',
    region: 'eu-west-1',
    file: '',
    mime,
    client: `client-${publicKey}`
  };

  const message = await send({ event: MessageEvent.CREATE, table: Table.JOBS, payload });

  return message.payload as Job;
}

async function send(message: Partial<Message>): Promise<Message> {
  if (ws.readyState !== WebSocket.OPEN) {
    console.error('Socket not open', ws.readyState);

    return new Promise((cb) => setTimeout(() => cb(send(message)), 1000));
  }

  const cid = crypto.randomUUID();

  const promise = new Promise<Message>((cb) => {
    ws.on('incoming', function listener(message: Message) {
      if (message?.cid !== cid) return;

      ws.off('incoming', listener);

      cb(message);
    });
  });

  ws.send(
    JSON.stringify({
      message,
      cid
    })
  );

  return promise;
}
