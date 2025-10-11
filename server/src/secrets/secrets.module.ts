import { secrets } from 'shared';
import { Global, Module } from '@nestjs/common';

import { SecretsService } from './secrets.service';

@Global()
@Module({
  providers: [
    {
      provide: SecretsService,
      useFactory: async () => {
        const loadedSecrets = await secrets.getSecrets('server-secrets');

        return new SecretsService(loadedSecrets || {});
      }
    }
  ],
  exports: [SecretsService]
})
export class SecretsModule {}
