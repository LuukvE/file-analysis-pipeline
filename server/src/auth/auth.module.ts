import { Module } from '@nestjs/common';

import { GoogleController } from './google.controller';

@Module({
  providers: [],
  controllers: [GoogleController]
})
export class AuthModule {}
