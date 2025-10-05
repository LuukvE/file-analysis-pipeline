import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocket, WebSocketServer as WsServer } from 'ws';
import { MessageEvent, Table, type Job, type Result } from 'shared/types';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { MessageDto } from './message.dto';
import { JobsService, JOB_CHANGED_EVENT } from './db/jobs.service';
import { ResultsService, RESULT_CHANGED_EVENT } from './db/results.service';

@WebSocketGateway({
  cors: { origin: '*' }
})
export class AppGateway {
  @WebSocketServer()
  server: WsServer;

  private readonly logger = new Logger(AppGateway.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly results: ResultsService
  ) {}

  @SubscribeMessage('message')
  async handleMessage(_client: WebSocket, data: MessageDto): Promise<void> {
    const { table, event, payload } = data;

    try {
      if (table === Table.JOBS) {
        if (event === 'create') await this.jobs.create(payload as Job);
        if (event === 'update') await this.jobs.update(payload as Job, '');
      }

      if (table === Table.RESULTS) {
        if (event === 'create') await this.results.create(payload as Result);
        if (event === 'update') await this.results.update(payload as Result, '');
      }
    } catch (error) {
      this.logger.error(`Failed to process message for entity ${table} with ${event}`, error);
    }
  }

  private broadcast(message: MessageDto) {
    const payload = JSON.stringify(message);

    this.server.clients.forEach((client: WebSocket) => {
      if (client.readyState !== WebSocket.OPEN) return;

      client.send(payload);
    });
  }

  @OnEvent(JOB_CHANGED_EVENT)
  handleJobChange(payload: Job) {
    this.logger.log('Broadcasting job change', payload);

    this.broadcast({
      table: Table.JOBS,
      event: MessageEvent.RECEIVE,
      payload
    });
  }

  @OnEvent(RESULT_CHANGED_EVENT)
  handleResultChange(payload: Result) {
    this.logger.log('Broadcasting result change', payload);

    this.broadcast({
      table: Table.RESULTS,
      event: MessageEvent.RECEIVE,
      payload
    });
  }
}
