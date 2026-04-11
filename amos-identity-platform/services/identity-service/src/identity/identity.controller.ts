import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IdentityService } from './identity.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('identity')
@UseGuards(JwtAuthGuard)
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('session')
  async createSession(@Body() dto: CreateSessionDto) {
    return this.identity.createSession(dto);
  }

  @Post(':id/document')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('type') type: 'passport' | 'id_card' | 'driver_license',
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.identity.uploadDocument(id, type, file.buffer);
  }

  @Post(':id/selfie')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadSelfie(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.identity.uploadSelfie(id, file.buffer);
  }

  @Post(':id/verify')
  async verify(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.identity.verify(id);
  }

  @Get(':id/status')
  async status(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.identity.status(id);
  }
}
