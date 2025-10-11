import { Controller, Get } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

@Controller()
export class MetricsController {
  private static registry = new Registry();
  private static httpRequestDuration: Histogram<string>;
  private static httpRequestsTotal: Counter<string>;

  static {
    this.registry.setDefaultLabels({ app: 'server' });
    collectDefaultMetrics({ register: this.registry });
    this.initializeMetrics();
  }

  private static initializeMetrics() {
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
      buckets: [0.1, 0.5, 1, 1.5, 2, 5],
      registers: [this.registry]
    });
  }

  public static incrementHttpRequestsTotal(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode
    });
  }

  public static observeHttpRequestDuration(
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

  @Get('metrics')
  async getMetrics(): Promise<string> {
    return MetricsController.registry.metrics();
  }
}
