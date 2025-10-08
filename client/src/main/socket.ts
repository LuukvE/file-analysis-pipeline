import { type Message } from 'shared/types';
import WebSocket, { type Data } from 'ws';

export class Socket {
  url = 'ws://localhost:8080';
  ws: WebSocket;

  constructor() {
    this.ws = this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => console.log('Websocket established'));

    this.ws.on('error', (error: Error) => {
      console.log('Websocket error', error);

      setTimeout(() => this.connect(), 1000);
    });

    return this.ws;
  }

  async send<T extends Message>(msg: Partial<T> & Message): Promise<T> {
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error('Socket is closed');

      return new Promise((cb) => setTimeout(() => cb(this.send(msg)), 1000));
    }

    const promise = new Promise<T>((cb) => {
      console.log('>', msg.table, msg.cid);

      this.ws.on('message', function listener(data: Data) {
        const message = JSON.parse(data.toString('utf-8')) as T;

        if (message?.cid !== msg.cid) return;

        console.log('<', msg.table, msg.cid);

        this.off('message', listener);

        cb(message);
      });
    });

    this.ws.send(JSON.stringify(msg));

    return promise;
  }

  destroy() {
    this.ws.close();
  }
}
