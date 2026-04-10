import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CarSchema } from '../schemas/car.schema';
import { BidSchema } from '../schemas/bid.schema';
import { BidsModule } from '../bids/bids.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Car', schema: CarSchema },
      { name: 'Bid', schema: BidSchema },
    ]),
    BidsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
