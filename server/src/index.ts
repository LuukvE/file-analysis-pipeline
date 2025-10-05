// import { NestFactory } from '@nestjs/core';
// import { WsAdapter } from '@nestjs/platform-ws';
// import { AppModule } from './app.module';

// (async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.useWebSocketAdapter(new WsAdapter(app));

//   await app.listen(3000);
// })();

import http from 'http';

console.log(process.env);

http
  .createServer((_, res) => {
    res.writeHead(200);
    res.end('hi!');
  })
  .listen(parseInt(`${process.env['PORT']}`));
