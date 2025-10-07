import { Module } from '@nestjs/common';
import { getSecrets } from 'shared/secrets';

import { SecretsService } from './secrets.service';

@Module({
  providers: [
    {
      provide: SecretsService,
      useFactory: async () => {
        const secrets = await getSecrets('server-secrets');

        return new SecretsService(secrets || {});
      }
    }
  ],
  exports: [SecretsService]
})
export class SecretsModule {}
