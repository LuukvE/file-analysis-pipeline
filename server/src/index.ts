import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { NestApplicationOptions } from '@nestjs/common';

import { AppModule } from './app.module';

(async function bootstrap() {
  const opts: NestApplicationOptions = { logger: ['warn', 'error'] };
  const app = await NestFactory.create(AppModule, opts);

  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(8080);
})();
