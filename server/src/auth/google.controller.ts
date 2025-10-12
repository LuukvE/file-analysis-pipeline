import { join } from 'path';
import { readFileSync } from 'fs';
import { google } from 'googleapis';
import { type Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Controller, Get, Query, Redirect, Req, Header } from '@nestjs/common';

import { SecretsService } from '../secrets/secrets.service';

@Controller()
export class GoogleController {
  constructor(
    private jwt: JwtService,
    private secrets: SecretsService
  ) {}

  @Get('v1/google/init')
  @Redirect()
  async init(@Req() req: Request) {
    const params = new URLSearchParams({
      client_id: this.secrets.get('GOOGLE_CLIENT_ID'),
      redirect_uri: `${req.protocol}://${req.host}/v1/google/authenticate`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline'
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      statusCode: 302
    };
  }

  @Get('v1/google/authenticate')
  @Redirect()
  async authenticate(@Req() req: Request, @Query('code') code: string) {
    const oauth2Client = new google.auth.OAuth2(
      this.secrets.get('GOOGLE_CLIENT_ID'),
      this.secrets.get('GOOGLE_SECRET'),
      `${req.protocol}://${req.host}/v1/google/authenticate`
    );

    const { tokens } = await oauth2Client.getToken(code || '');

    const googleRequest = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.id_token}`
        }
      }
    );

    if (googleRequest.status >= 300) {
      return {
        url: `file-analysis-pipeline://error`,
        statusCode: 302
      };
    }

    const result: { id: string; email: string } = await googleRequest.json();
    const payload = { sub: result.id, email: `${result.email}`.toLowerCase() };
    const token = await this.jwt.signAsync(payload);

    return {
      url: `/v1/google/success?token=${token}`,
      statusCode: 302
    };
  }

  SUCCESS_HTML = readFileSync(join(__dirname, './signin.html'), 'utf-8');

  @Get('v1/google/success')
  @Header('Content-Type', 'text/html')
  success() {
    return this.SUCCESS_HTML;
  }
}
