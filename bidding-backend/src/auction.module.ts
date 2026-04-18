import { Module } from '@nestjs/common';
import { BidsModule } from './bids/bids.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { CarSchema } from './schemas/car.schema';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Car', schema: CarSchema }]),
    CloudinaryModule,
    BidsModule,
  ],
  controllers: [AuctionController],
  providers: [AuctionService],
})
export class AuctionModule {}