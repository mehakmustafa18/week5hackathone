import { Injectable, BadRequestException } from '@nestjs/common';
import 'multer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Car } from '../schemas/car.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductAuctionsService {
  constructor(
    @InjectModel('Car') private carModel: Model<Car>,
    private cloudinaryService: CloudinaryService,
    private eventEmitter: EventEmitter2,
  ) { }

  // 1. Nayi car add karna (Sell Your Car form)
  async createCar(carData: any, userId: string, files?: Array<Express.Multer.File>) {
    let imageUrls: string[] = [];

    // Cloudinary pe images upload karna agar bhenji gayi hain
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.cloudinaryService.uploadImage(file));
      try {
        const results = await Promise.all(uploadPromises);
        imageUrls = results.map(result => ('secure_url' in result) ? (result as any).secure_url : '');
      } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new BadRequestException('Image upload failed: ' + (error as any).message);
      }
    }

    // Cast fields to correct types (since multipart/form-data is all strings)
    const year = Number(carData.year);
    const basePrice = Number(carData.basePrice);
    const endTime = new Date(carData.endTime);

    if (isNaN(year) || isNaN(basePrice)) {
      throw new BadRequestException('Year and Base Price must be valid numbers.');
    }

    const newCar = new this.carModel({
      ...carData,
      year,
      basePrice,
      images: imageUrls.length > 0 ? imageUrls.filter(url => url) : [],
      sellerId: userId,
      currentBid: basePrice,
      endTime,
    });

    const savedCar = await newCar.save();

    // Trigger Notification via Event
    this.eventEmitter.emit('car.created', {
      type: 'NEW_CAR',
      message: `New car ${carData.make} ${carData.modelName} just added to auction!`,
      carId: savedCar._id,
    });

    return savedCar;
  }

  // 2. Saari cars dikhana with Search & Filters
  async findAll(query: any) {
    const { search, make, model, year, minPrice, maxPrice, category, bodyType } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { make: { $regex: search, $options: 'i' } },
        { modelName: { $regex: search, $options: 'i' } },
      ];
    }
    if (make) filter.make = make;
    if (model) filter.modelName = model;
    if (year) filter.year = year;
    if (category) filter.category = category;
    if (bodyType) filter.bodyType = bodyType;
    if (minPrice || maxPrice) {
      // Use currentBid for filtering if available, fallback to basePrice
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      filter.$or = [
        { currentBid: { $gte: min, $lte: max } },
        { $and: [{ currentBid: { $exists: false } }, { basePrice: { $gte: min, $lte: max } }] }
      ];
    }

    return await this.carModel.find(filter).populate('sellerId', 'name email').exec();
  }

  // 3. Single Car detail (Bid lagane ke liye)
  async findOne(id: string) {
    return await this.carModel.findById(id).populate('sellerId', 'name email').exec();
  }

  // 4. Distinct body types and categories for frontend tabs
  async getMetadata() {
    const bodyTypes = await this.carModel.distinct('bodyType');
    const categories = await this.carModel.distinct('category');
    return { bodyTypes, categories };
  }
}