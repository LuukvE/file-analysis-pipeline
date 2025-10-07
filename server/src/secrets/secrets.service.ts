import { Injectable } from '@nestjs/common';

@Injectable()
export class SecretsService {
  private readonly secrets: Record<string, any>;

  constructor(secrets: Record<string, any>) {
    this.secrets = secrets;
  }

  get(key: string): any {
    return this.secrets[key];
  }
}