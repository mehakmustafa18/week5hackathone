import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsService } from './bids.service';
import { BidsGateway } from './bids.gateway';
import { BidsController } from './bids.controller';
import { BidSchema } from '../schemas/bid.schema';
import { CarSchema } from '../schemas/car.schema';
import { AuthModule } from '../authentication/auth.module';
import { WsJwtAuthGuard } from '../authentication/ws-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Bid', schema: BidSchema },
      { name: 'Car', schema: CarSchema },
    ]),
    AuthModule,
  ],
  controllers: [BidsController],
  providers: [BidsService, BidsGateway, WsJwtAuthGuard],
  exports: [BidsService, BidsGateway],
})
export class BidsModule { }
