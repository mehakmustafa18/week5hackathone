import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UserSchema } from '../schemas/user.schema';
import { CarSchema } from '../schemas/car.schema';
import { BidSchema } from '../schemas/bid.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Car', schema: CarSchema },
      { name: 'Bid', schema: BidSchema },
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
