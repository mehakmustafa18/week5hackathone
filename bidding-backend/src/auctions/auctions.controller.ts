import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuctionsService } from './auctions.service';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('cars')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) { }

  @Get()
  async findAll(@Query() query: any) {
    return this.auctionsService.findAll(query);
  }

  @Get('metadata')
  async getMetadata() {
    return this.auctionsService.getMetadata();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() carData: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    return this.auctionsService.createCar(carData, req.user._id, files);
  }
}