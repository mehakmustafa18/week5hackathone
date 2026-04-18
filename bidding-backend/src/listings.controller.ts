import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from './authentication/jwt-auth.guard';

@Controller('cars')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) { }

  @Get()
  async findAll(@Query() query: any) {
    return this.listingsService.findAll(query);
  }

  @Get('metadata')
  async getMetadata() {
    return this.listingsService.getMetadata();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() carData: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    return this.listingsService.createCar(carData, req.user._id, files);
  }
}