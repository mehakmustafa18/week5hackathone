import { NestFactory } from '@nestjs/core';
import { Module, Injectable, BadRequestException, Controller, Get, Post, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';

// Internal Imports
import { AuthModule } from './authentication/auth.module';
import { BidsModule } from './bids/bids.module';
import { PaymentsModule } from './payments/payments.module';
import { ProfileModule } from './profile/profile.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { Car, CarSchema } from './schemas/car.schema';
import { JwtAuthGuard } from './authentication/jwt-auth.guard';

// --- AUCTION SERVICE ---
@Injectable()
export class AuctionService {
  constructor(
    @InjectModel('Car') private carModel: Model<Car>,
    private cloudinaryService: CloudinaryService,
    private eventEmitter: EventEmitter2,
  ) { }

  async createCar(carData: any, userId: string, files?: Array<Express.Multer.File>) {
    let imageUrls: string[] = [];
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
    this.eventEmitter.emit('car.created', {
      type: 'NEW_CAR',
      message: `New car ${carData.make} ${carData.modelName} just added to auction!`,
      carId: savedCar._id,
    });
    return savedCar;
  }

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
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      filter.$or = [
        { currentBid: { $gte: min, $lte: max } },
        { $and: [{ currentBid: { $exists: false } }, { basePrice: { $gte: min, $lte: max } }] }
      ];
    }
    return await this.carModel.find(filter).populate('sellerId', 'name email').exec();
  }

  async findOne(id: string) {
    return await this.carModel.findById(id).populate('sellerId', 'name email').exec();
  }

  async getMetadata() {
    const bodyTypes = await this.carModel.distinct('bodyType');
    const categories = await this.carModel.distinct('category');
    return { bodyTypes, categories };
  }
}

// --- AUCTION CONTROLLER ---
@Controller('cars')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) { }

  @Get()
  async findAll(@Query() query: any) {
    return this.auctionService.findAll(query);
  }

  @Get('metadata')
  async getMetadata() {
    return this.auctionService.getMetadata();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auctionService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() carData: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    return this.auctionService.createCar(carData, req.user._id, files);
  }
}

// --- AUCTION MODULE ---
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Car', schema: CarSchema }]),
    CloudinaryModule,
    BidsModule,
  ],
  controllers: [AuctionController],
  providers: [AuctionService],
  exports: [AuctionService],
})
class AuctionModule {}

// --- MAIN APP MODULE ---
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    AuthModule,
    AuctionModule,
    BidsModule,
    PaymentsModule,
    ProfileModule,
    CloudinaryModule,
  ],
})
export class AppModule { }

// --- BOOTSTRAP ---
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enabling CORS for frontend
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Bidding Backend (Singularity) is running on: http://localhost:${port}`);
}
bootstrap();
