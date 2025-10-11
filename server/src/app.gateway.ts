import { OnEvent } from '@nestjs/event-emitter';
import { WebSocket, WebSocketServer as WsServer } from 'ws';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Chunk, Table, type Job, type Message, type Result } from 'shared';

import { JOB_CHANGED_EVENT, JobsService } from './db/jobs.service';
import { CHUNK_CHANGED_EVENT, ChunksService } from './db/chunks.service';
import { RESULT_CHANGED_EVENT, ResultsService } from './db/results.service';

@WebSocketGateway({
  cors: { origin: '*' }
})
export class AppGateway {
  @WebSocketServer()
  server: WsServer;

  constructor(
    private jobs: JobsService,
    private chunks: ChunksService,
    private results: ResultsService
  ) {}

  @OnEvent(JOB_CHANGED_EVENT)
  @OnEvent(CHUNK_CHANGED_EVENT)
  @OnEvent(RESULT_CHANGED_EVENT)
  broadcast(message: Message) {
    const payload = JSON.stringify(message);

    console.log('broadcast', message);

    this.server.clients.forEach((client: WebSocket) => {
      if (client.readyState !== WebSocket.OPEN) return;

      client.send(payload);
    });
  }

  handleConnection(client: WebSocket) {
    const { jobs, results, chunks } = this;

    console.log('listening for messages');

    client.on('message', (data, binary) => {
      if (binary) return;

      try {
        const msg: Message = JSON.parse(data.toString());
        const { table, id } = msg;

        if (!id && table === Table.JOBS) return jobs.create(msg as Job);

        if (table === Table.JOBS) return jobs.update(msg as Job, '#chunks <= :chunks');

        if (!id && table === Table.CHUNKS) return chunks.create(msg as Chunk);

        if (!id && table === Table.RESULTS) return results.create(msg as Result);

        if (table === Table.RESULTS) return results.update(msg as Result, '');
      } catch (error) {
        console.error('Failed to process message', data, error);
      }
    });
  }
}
