import { Controller, Req, Res, UseGuards, Get } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SseService } from './sse.service';
import { Sse } from './decorators/sse.decorator';

@Controller('events')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @UseGuards(JwtAuthGuard)
  @Get('stream')
  @Sse('stream')
  stream(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
    this.sseService.addClient(String(user.sub), String(user.role), res);

    res.write(`data: ${JSON.stringify({ message: 'Connected' })}\n\n`);

    req.on('close', () => {
      this.sseService.removeClient(res);
      res.end();
    });
  }
}
