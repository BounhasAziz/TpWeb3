import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CvService } from './cv.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cvs')
@UseGuards(JwtAuthGuard)
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post()
  create(@Body() dto: CreateCvDto, @Req() req: any) {
    return this.cvService.create(dto, req.user.sub);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.cvService.findAll(req.user.sub, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cvService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCvDto, @Req() req: any) {
    return this.cvService.update(+id, dto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.cvService.remove(+id, req.user.sub, req.user.role);
  }
}
