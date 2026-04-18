import { Module } from '@nestjs/common';
import { BidsModule } from '../bids/bids.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { CarSchema } from '../schemas/car.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Car', schema: CarSchema }]),
    CloudinaryModule,
    BidsModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService],
})
export class AuctionsModule {}