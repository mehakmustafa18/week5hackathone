import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CarsService } from './cars.service';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) { }

  @Get()
  async findAll(@Query() query: any) {
    return this.carsService.findAll(query);
  }

  @Get('metadata')
  async getMetadata() {
    return this.carsService.getMetadata();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() carData: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    return this.carsService.createCar(carData, req.user._id, files);
  }
}