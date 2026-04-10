import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Car } from '../schemas/car.schema';
import { Bid } from '../schemas/bid.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Car') private carModel: Model<Car>,
    @InjectModel('Bid') private bidModel: Model<Bid>,
  ) {}

  async getMe(userId: string) {
    return await this.userModel.findById(userId).select('-password').exec();
  }

  async getMyCars(userId: string) {
    return await this.carModel.find({ sellerId: new Types.ObjectId(userId) }).exec();
  }

  async getMyBids(userId: string) {
    // Find all unique cars where the user has placed a bid, and get the user's max bid for each
    const bids = await this.bidModel.find({ userId: new Types.ObjectId(userId) }).exec();
    const carIds = [...new Set(bids.map(bid => bid.carId.toString()))];
    
    const results = await Promise.all(carIds.map(async (carId) => {
      const car = await this.carModel.findById(carId).exec();
      const userBids = bids.filter(b => b.carId.toString() === carId);
      const myMaxBid = Math.max(...userBids.map(b => b.amount));
      return {
        car,
        myMaxBid,
      };
    }));

    return results;
  }

  async getWishlist(userId: string) {
    const user = await this.userModel.findById(userId).populate('wishlist').exec();
    return user.wishlist;
  }

  async toggleWishlist(userId: string, carId: string) {
    const user = await this.userModel.findById(userId);
    const carObjectId = new Types.ObjectId(carId);
    
    const index = user.wishlist.findIndex(id => id.toString() === carId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(carObjectId);
    }
    
    await user.save();
    return user.wishlist;
  }
}
