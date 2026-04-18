import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductAuctionsService } from './product-auctions.service';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('cars')
export class ProductAuctionsController {
  constructor(private readonly productAuctionsService: ProductAuctionsService) { }

  @Get()
  async findAll(@Query() query: any) {
    return this.productAuctionsService.findAll(query);
  }

  @Get('metadata')
  async getMetadata() {
    return this.productAuctionsService.getMetadata();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productAuctionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() carData: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    return this.productAuctionsService.createCar(carData, req.user._id, files);
  }
}