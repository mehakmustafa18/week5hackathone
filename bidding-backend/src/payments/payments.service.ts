import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Car } from '../schemas/car.schema';
import { Bid } from '../schemas/bid.schema';
import { BidsGateway } from '../bids/bids.gateway';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel('Car') private carModel: Model<Car>,
    @InjectModel('Bid') private bidModel: Model<Bid>,
    private readonly bidsGateway: BidsGateway,
  ) {}

  async makePayment(carId: string) {
    const car = await this.carModel.findById(carId);

    if (!car) {
      throw new BadRequestException('Car not found');
    }

    // Find the winner (highest bidder)
    const topBid = await this.bidModel.findOne({ carId }).sort({ amount: -1 }).exec();
    const winnerId = topBid?.userId?.toString() || '';
    const sellerId = car.sellerId?.toString() || '';

    // Mark as sold
    car.status = 'sold';
    await car.save();

    // Notify auction room that payment is complete
    this.bidsGateway.sendNotification(`auction_${carId}`, 'deliveryUpdate', {
      status: 'sold',
      label: 'Payment Complete',
      message: 'Payment has been received. Car is ready for shipping.',
    });

    // Notify SELLER only — payment received
    this.bidsGateway.sendNotification(null, 'notification', {
      type: 'PAYMENT_COMPLETE',
      message: `Payment received for ${car.make} ${car.modelName}. Please update shipping status.`,
      carId: car._id,
      forUserId: sellerId,
    });

    // Notify WINNER only — payment confirmed
    this.bidsGateway.sendNotification(null, 'notification', {
      type: 'PAYMENT_COMPLETE',
      message: `Your payment for ${car.make} ${car.modelName} was successful! Awaiting seller to ship.`,
      carId: car._id,
      forUserId: winnerId,
    });

    return { message: 'Payment successful. Waiting for seller to update shipping.', status: 'sold' };
  }

  async getPaymentDetails(carId: string) {
    return await this.carModel.findById(carId).populate('sellerId', 'name email').exec();
  }

  async updateShippingStatus(carId: string, sellerId: string, status: string) {
    const car = await this.carModel.findById(carId);

    if (!car) {
      throw new BadRequestException('Car not found');
    }

    const sellerIdStr = car.sellerId?.toString();
    if (sellerIdStr !== sellerId.toString()) {
      throw new ForbiddenException('Only the seller can update shipping status');
    }

    const allowedStatuses = ['sold', 'shipped', 'delivered', 'completed'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    car.status = status;
    await car.save();

    const statusLabels: any = {
      sold: 'Payment Complete',
      shipped: 'In Transit',
      delivered: 'Delivered',
      completed: 'Completed',
    };

    // Find the winner (highest bidder) to target notification
    const topBid = await this.bidModel.findOne({ carId }).sort({ amount: -1 }).exec();
    const winnerId = topBid?.userId?.toString() || '';

    // Emit delivery update to auction room
    this.bidsGateway.sendNotification(`auction_${carId}`, 'deliveryUpdate', {
      status,
      label: statusLabels[status] || status,
      message: `Your car status has been updated to: ${statusLabels[status] || status}`,
    });

    // Notify WINNER only about status update
    this.bidsGateway.sendNotification(null, 'notification', {
      type: `STATUS_UPDATE_${status.toUpperCase()}`,
      message: `Great news! Your ${car.make} ${car.modelName} is now ${statusLabels[status]} 🚙`,
      carId: car._id,
      forUserId: winnerId,
    });

    // Notify SELLER only about status update confirmation
    this.bidsGateway.sendNotification(null, 'notification', {
      type: `STATUS_UPDATE_${status.toUpperCase()}`,
      message: `${car.make} ${car.modelName} status updated to "${statusLabels[status]}"`,
      carId: car._id,
      forUserId: sellerIdStr,
    });

    return { message: `Status updated to ${status}`, status };
  }
}
