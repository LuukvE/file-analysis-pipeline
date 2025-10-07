import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocket, WebSocketServer as WsServer } from 'ws';
import { Table, Chunk, type Message, type Job, type Result } from 'shared/types';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { ChunksService } from './db/chunks.service';
import { JobsService, JOB_CHANGED_EVENT } from './db/jobs.service';
import { ResultsService, RESULT_CHANGED_EVENT } from './db/results.service';

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

  @SubscribeMessage('message')
  async handleMessage(_client: WebSocket, data: Message): Promise<void> {
    this.save(data);
  }

  @OnEvent(JOB_CHANGED_EVENT)
  handleJobChange(message: Job) {
    this.broadcast(message);
  }

  @OnEvent(RESULT_CHANGED_EVENT)
  handleResultChange(message: Result) {
    this.broadcast(message);
  }

  async save(data: Message) {
    try {
      const { table, id } = data;

      if (!id && table === Table.JOBS) return this.jobs.create(data as Job);

      if (table === Table.JOBS) return this.jobs.update(data as Job, '#chunks <= :chunks');

      if (!id && table === Table.CHUNKS) return this.chunks.create(data as Chunk);

      if (!id && table === Table.RESULTS) await this.results.create(data as Result);

      if (table === Table.RESULTS) await this.results.update(data as Result, '');
    } catch (error) {
      this.logger.error('Failed to process message', data, error);
    }
  }

  private broadcast(message: Message) {
    const payload = JSON.stringify(message);

    this.server.clients.forEach((client: WebSocket) => {
      client;
      if (client.readyState !== WebSocket.OPEN) return;

      client.send(payload);
    });
  }
}
