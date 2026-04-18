import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuctionService } from './auction.service';
import { JwtAuthGuard } from './authentication/jwt-auth.guard';

@Controller('cars')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) { }

  @Get()
  async findAll(@Query() query: any) {
    return this.auctionService.findAll(query);
  }

  @Get('metadata')
  async getMetadata() {
    return this.auctionService.getMetadata();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auctionService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() carData: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    return this.auctionService.createCar(carData, req.user._id, files);
  }
}