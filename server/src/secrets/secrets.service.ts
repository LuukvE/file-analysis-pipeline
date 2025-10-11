import { Injectable } from '@nestjs/common';

@Injectable()
export class SecretsService {
  private secrets: Record<string, any>;

  constructor(secrets: Record<string, any>) {
    this.secrets = secrets;
  }

  get(key: string): string {
    return this.secrets[key] || '';
  }
}
