import { type Message } from 'shared';
import WebSocket, { type Data } from 'ws';

export class Socket {
  url = 'ws://localhost:8080';
  ws: WebSocket;

  constructor() {
    this.ws = this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {});

    this.ws.on('error', (error: Error) => {
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
      this.ws.on('message', function listener(data: Data) {
        const message = JSON.parse(data.toString('utf-8')) as T;

        if (message?.cid !== msg.cid) return;

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
