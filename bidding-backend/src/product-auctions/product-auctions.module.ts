import { Module } from '@nestjs/common';
import { BidsModule } from '../bids/bids.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductAuctionsService } from './product-auctions.service';
import { ProductAuctionsController } from './product-auctions.controller';
import { CarSchema } from '../schemas/car.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Car', schema: CarSchema }]),
    CloudinaryModule,
    BidsModule,
  ],
  controllers: [ProductAuctionsController],
  providers: [ProductAuctionsService],
})
export class ProductAuctionsModule {}