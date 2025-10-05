import { Controller, Get } from '@nestjs/common';

@Controller()
export class StatusController {
  constructor() {}

  @Get('*')
  getStatus(): { healthy: boolean } {
    return { healthy: true }
  }
}
