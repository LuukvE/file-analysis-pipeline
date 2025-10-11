import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsController } from './metrics.controller';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime();

    res.on('finish', () => {
      const route = req.route ? req.route.path : req.originalUrl;

      if (route === '/metrics') return;

      const diff = process.hrtime(startTime);
      const durationInSeconds = diff[0] + diff[1] / 1e9;
      const method = req.method;
      const statusCode = res.statusCode;

      MetricsController.incrementHttpRequestsTotal(method, route, statusCode);

      MetricsController.observeHttpRequestDuration(
        method,
        route,
        statusCode,
        durationInSeconds
      );
    });

    next();
  }
}
