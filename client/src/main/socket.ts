import { type Message } from 'shared';
import WebSocket, { type Data } from 'ws';

export class Socket {
  url = 'ws://localhost:8080';
  ws: WebSocket;

  constructor(private token: string) {
    this.ws = this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    this.ws.on('error', (_) => {
      setTimeout(() => this.connect(), 1000);
    });

    return this.ws;
  }

  async send<T extends Message>(msg: Partial<T> & Message, retry = 0): Promise<T | void> {
    if (this.ws.readyState !== WebSocket.OPEN) {
      if (retry > 3) return console.error('Socket is closed');

      return new Promise((cb) => setTimeout(() => cb(this.send(msg, retry + 1)), 1000));
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
