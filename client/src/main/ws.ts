import { app } from 'electron';
import { lookup } from 'mime-types';
import WebSocket, { type Data } from 'ws';
import { Table, type Job, type Message } from 'shared/types';

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

export async function createJob(path: string): Promise<Job> {
  const mime = lookup(path) || 'application/octet-stream';

  const job: Job = {
    id: '',
    cid: crypto.randomUUID(),
    table: Table.JOBS,
    version: app.getVersion(),
    mime,
    client: `client-${publicKey}`,
    created: new Date().toJSON()
  };

  return send<Job>(job);
}

export async function send<T extends Message>(msg: Partial<T> & Message): Promise<T> {
  if (ws.readyState !== WebSocket.OPEN) {
    console.error('Socket not open', ws.readyState);

    return new Promise((cb) => setTimeout(() => cb(send(msg)), 1000));
  }

  const cid = crypto.randomUUID();

  const promise = new Promise<T>((cb) => {
    ws.on('incoming', function listener(message: T) {
      if (message?.cid !== cid) return;

      ws.off('incoming', listener);

      cb(message);
    });
  });

  ws.send(JSON.stringify(msg));

  return promise;
}
