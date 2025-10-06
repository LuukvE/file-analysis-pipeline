import { Controller, Get } from '@nestjs/common';

@Controller()
export class StatusController {
  constructor() {}

  @Get('*')
  getStatus(): { healthy: boolean, test: number } {
    return { healthy: true, test: 10 }
  }
}
