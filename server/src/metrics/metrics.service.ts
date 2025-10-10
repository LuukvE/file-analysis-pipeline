import { Injectable, OnModuleInit } from '@nestjs/common';

import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();
  private httpRequestDuration: Histogram<string>;
  private httpRequestsTotal: Counter<string>;

  constructor() {
    this.registry.setDefaultLabels({
      app: 'server'
    });
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
    this.registerCustomMetrics();
  }

  private registerCustomMetrics() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 1.5, 2, 5], // Define your own buckets
      registers: [this.registry]
    });
  }

  // Method to increment the total requests counter
  public incrementHttpRequestsTotal(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode
    });
  }

  // Method to observe request duration
  public observeHttpRequestDuration(
    method: string,
    route: string,
    statusCode: number,
    durationInSeconds: number
  ) {
    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode
      },
      durationInSeconds
    );
  }

  public async getMetrics() {
    return this.registry.metrics();
  }

  public getContentType() {
    return this.registry.contentType;
  }
}
