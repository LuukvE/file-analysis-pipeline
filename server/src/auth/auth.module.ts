import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { GoogleController } from './google.controller';
import { SecretsModule } from '../secrets/secrets.module';
import { SecretsService } from '../secrets/secrets.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [SecretsModule],
      inject: [SecretsService],
      useFactory: async (secrets: SecretsService) => ({
        secret: secrets.get('JWT_SECRET')
      })
    })
  ],
  controllers: [GoogleController],
  exports: [JwtModule]
})
export class AuthModule {}
