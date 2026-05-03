import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { CvEventService } from './cv-event.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cv-events')
@UseGuards(JwtAuthGuard)
export class CvEventController {
  constructor(private readonly cvEventService: CvEventService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.cvEventService.findAll();
  }

  @Get('my')
  findMine(@Req() req: any) {
    return this.cvEventService.findByUser(req.user.sub);
  }

  @Get('cv/:cvId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findByCv(@Param('cvId') cvId: string) {
    return this.cvEventService.findByCv(+cvId);
  }
}
