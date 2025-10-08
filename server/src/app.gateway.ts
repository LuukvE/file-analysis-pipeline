import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Chunk, Table, type Job, type Message, type Result } from 'shared/types';
import { WebSocket, WebSocketServer as WsServer } from 'ws';

import { JOB_CHANGED_EVENT, JobsService } from './db/jobs.service';
import { CHUNK_CHANGED_EVENT, ChunksService } from './db/chunks.service';
import { RESULT_CHANGED_EVENT, ResultsService } from './db/results.service';

@WebSocketGateway({
  cors: { origin: '*' }
})
export class AppGateway {
  @WebSocketServer()
  server: WsServer;

  logger = new Logger(AppGateway.name);

  constructor(
    private jobs: JobsService,
    private chunks: ChunksService,
    private results: ResultsService
  ) {}

  @OnEvent(JOB_CHANGED_EVENT)
  @OnEvent(CHUNK_CHANGED_EVENT)
  @OnEvent(RESULT_CHANGED_EVENT)
  broadcast(message: Message) {
    console.log('broadcasting', message.id);

    const payload = JSON.stringify(message);

    this.server.clients.forEach((client: WebSocket) => {
      if (client.readyState !== WebSocket.OPEN) return;

      console.log('sending', payload);

      client.send(payload);
    });
  }

  handleConnection(client: WebSocket) {
    this.logger.log(`Client connected`);

    client.on('message', (data, binary) => {
      if (binary) return this.logger.log('Client sent binary data');

      try {
        const msg: Message = JSON.parse(data.toString());
        const { table, id } = msg;

        console.log('receiving', table, id);

        if (!id && table === Table.JOBS) return this.jobs.create(msg as Job);

        if (table === Table.JOBS) return this.jobs.update(msg as Job, '#chunks <= :chunks');

        if (!id && table === Table.CHUNKS) return this.chunks.create(msg as Chunk);

        if (!id && table === Table.RESULTS) return this.results.create(msg as Result);

        if (table === Table.RESULTS) return this.results.update(msg as Result, '');
      } catch (error) {
        console.log('error', error);
        this.logger.error('Failed to process message', data, error);
      }
    });
  }
}
