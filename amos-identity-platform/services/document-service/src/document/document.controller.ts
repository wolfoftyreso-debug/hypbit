import { Body, Controller, Post } from '@nestjs/common';
import { DocumentService } from './document.service';
import { ExtractDto } from './dto/extract.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly svc: DocumentService) {}

  @Post('extract')
  extract(@Body() dto: ExtractDto) {
    return this.svc.extract(dto);
  }
}
