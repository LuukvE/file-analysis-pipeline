import { IsEnum, IsObject } from 'class-validator';
import { type Job, type Result, Table, MessageEvent } from 'shared/types';

export class MessageDto {
  @IsEnum(Table)
  table: Table;

  @IsEnum(MessageEvent)
  event: MessageEvent;

  @IsObject()
  payload: Job | Result;
}
