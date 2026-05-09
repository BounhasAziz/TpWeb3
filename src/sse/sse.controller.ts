import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SseService } from './sse.service';

@Controller('events')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @UseGuards(JwtAuthGuard)
  @Get('stream')
  stream(@Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const user = (req as any).user;
    this.sseService.addClient(String(user.sub), String(user.role), res);

    res.write(`data: ${JSON.stringify({ message: 'Connected' })}\n\n`);

    req.on('close', () => {
      this.sseService.removeClient(res);
      res.end();
    });
  }
}