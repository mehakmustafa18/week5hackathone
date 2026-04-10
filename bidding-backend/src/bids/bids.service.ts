import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bid } from '../schemas/bid.schema';
import { Car } from '../schemas/car.schema';

@Injectable()
export class BidsService {
  constructor(
    @InjectModel('Bid') private bidModel: Model<Bid>,
    @InjectModel('Car') private carModel: Model<Car>,
    private eventEmitter: EventEmitter2,
  ) {}

  async placeBid(carId: string, userId: string, amount: number) {
    const car = await this.carModel.findById(carId);

    if (!car) {
      throw new BadRequestException('Car not found');
    }

    if (car.sellerId.toString() === userId) {
      throw new BadRequestException('You cannot bid on your own car');
    }

    if (amount <= car.currentBid) {
      throw new BadRequestException('Bid must be higher than current bid');
    }

    const newBid = new this.bidModel({
      carId,
      userId,
      amount,
    });

    const savedBid = await newBid.save();

    // Update current bid in Car
    car.currentBid = amount;
    await car.save();

    const populatedBid = await savedBid.populate('userId', 'name email phone profilePicture username');

    // Trigger Notification via Event
    this.eventEmitter.emit('bid.placed', {
      type: 'NEW_BID',
      message: `New bid of $${amount} placed on ${car.make} ${car.modelName}!`,
      carId: car._id,
      amount: amount,
    });

    return populatedBid;
  }

  async getBidsForCar(carId: string) {
    return await this.bidModel
      .find({ carId })
      .sort({ amount: -1 })
      .populate('userId', 'name email phone profilePicture username')
      .limit(10)
      .exec();
  }
}
