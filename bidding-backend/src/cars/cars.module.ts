import { Module } from '@nestjs/common';
import { BidsModule } from '../bids/bids.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { CarSchema } from '../schemas/car.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Car', schema: CarSchema }]),
    CloudinaryModule,
    BidsModule,
  ],
  controllers: [CarsController],
  providers: [CarsService],
})
export class CarsModule {}