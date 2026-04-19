import { NestFactory } from '@nestjs/core';
import { Module, Injectable, BadRequestException, ConflictException, UnauthorizedException, ForbiddenException, Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFiles, CanActivate, ExecutionContext } from '@nestjs/common';
import { MongooseModule, InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule, EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Document, Types, Model, Schema as MongooseSchema } from 'mongoose';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy, AuthGuard } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, WsException } from '@nestjs/websockets';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Server, Socket } from 'socket.io';
import 'multer';
import * as bcrypt from 'bcrypt';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

// ==========================================
// 1. SCHEMAS
// ==========================================

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop() name: string;
  @Prop() username: string;
  @Prop() phone: string;
  @Prop() profilePicture: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Car' }], default: [] }) wishlist: Types.ObjectId[];
}
export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ timestamps: true })
export class Car extends Document {
  @Prop({ required: true }) make: string;
  @Prop({ required: true }) modelName: string;
  @Prop({ required: true }) year: number;
  @Prop({ required: true }) basePrice: number;
  @Prop({ default: 0 }) currentBid: number;
  @Prop({ required: true }) bodyType: string;
  @Prop({ required: true }) images: string[];
  @Prop({ required: true }) category: string;
  @Prop({ required: true }) description: string;
  @Prop({ required: true }) endTime: Date;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) sellerId: Types.ObjectId;
  @Prop({ default: 'active' }) status: string;
}
export const CarSchema: MongooseSchema = SchemaFactory.createForClass(Car);

@Schema({ timestamps: true })
export class Bid extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Car', required: true }) carId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ required: true }) amount: number;
}
export const BidSchema = SchemaFactory.createForClass(Bid);

// ==========================================
// 2. SERVICES (BASE)
// ==========================================

@Injectable()
export class CloudinaryService {
  uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: 'cars' }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}

@Injectable()
export class AuthService {
  constructor(@InjectModel('User') private userModel: Model<User>, private jwtService: JwtService) {}
  async register(userData: any) {
    const { email, password } = userData;
    if (await this.userModel.findOne({ email })) throw new ConflictException('Email already exists');
    const hashedPassword = await bcrypt.hash(password, 10);
    return await new this.userModel({ ...userData, password: hashedPassword }).save();
  }
  async login(loginData: any) {
    const user = await this.userModel.findOne({ email: loginData.email });
    if (!user || !(await bcrypt.compare(loginData.password, user.password))) throw new UnauthorizedException('Invalid credentials');
    return { access_token: this.jwtService.sign({ email: user.email, sub: user._id }), user: { id: user._id, email: user.email, name: user.name } };
  }
}

@Injectable()
export class BidsService {
  constructor(
    @InjectModel('Bid') private bidModel: Model<Bid>, 
    @InjectModel('Car') private carModel: Model<Car>, 
    private eventEmitter: EventEmitter2
  ) {}

  async placeBid(carId: string, userId: string, amount: number) {
    const carObjectId = new Types.ObjectId(carId);
    const userObjectId = new Types.ObjectId(userId.toString());

    const car = await this.carModel.findById(carObjectId);
    if (!car) throw new BadRequestException('Car not found');
    if (car.status !== 'active') throw new BadRequestException('Auction has ended');
    if (car.sellerId.toString() === userId.toString()) throw new BadRequestException('You cannot bid on your own car');
    if (amount <= car.currentBid) throw new BadRequestException('Bid must be higher than current bid');
    
    // Find previous high bidder to notify them they were outbid
    const prevBid = await this.bidModel.findOne({ carId: carObjectId }).sort({ amount: -1 }).exec();
    
    // Save bid with explicit ObjectId types so the DB stores them consistently
    const savedBid = await new this.bidModel({ carId: carObjectId, userId: userObjectId, amount }).save();
    car.currentBid = amount;
    await car.save();
    
    // 1. Notify everyone about the new bid
    this.eventEmitter.emit('bid.placed', { 
      type: 'NEW_BID', 
      message: `New bid of $${amount} placed on ${car.make} ${car.modelName}!`, 
      carId: car._id.toString(), 
      amount 
    });

    // 2. Notify previous bidder specifically that they were outbid
    if (prevBid && prevBid.userId.toString() !== userId.toString()) {
      this.eventEmitter.emit('bid.outbid', {
        type: 'BID_LOST',
        message: `You have been outbid on ${car.make} ${car.modelName}. New bid is $${amount}.`,
        carId: car._id.toString(),
        forUserId: prevBid.userId.toString()
      });
    }

    return await savedBid.populate('userId', 'name email phone profilePicture username');
  }

  async getBidsForCar(carId: string) { 
    return await this.bidModel.find({ carId: new Types.ObjectId(carId) }).sort({ amount: -1 }).populate('userId', 'name email phone profilePicture username').limit(10).exec(); 
  }
}


// ==========================================
// 3. GATEWAY
// ==========================================

@WebSocketGateway({ cors: { origin: '*' } })
export class BidsGateway {
  @WebSocketServer() server: Server;
  constructor(private readonly bidsService: BidsService) {}
  @OnEvent('bid.placed') handleBidPlaced(p: any) { console.log('Relaying bid.placed:', p.type); this.server.emit('notification', p); }
  @OnEvent('bid.outbid') handleBidOutbid(p: any) { console.log('Relaying bid.outbid to:', p.forUserId); this.server.emit('notification', p); }
  @OnEvent('car.created') handleCarCreated(p: any) { console.log('Relaying car.created'); this.server.emit('notification', p); }
  @OnEvent('auction.ended') handleAuctionEnded(p: any) { console.log('Relaying auction.ended'); this.server.emit('notification', p); }
  @OnEvent('auction.won') handleAuctionWon(p: any) { console.log('Relaying auction.won to:', p.forUserId); this.server.emit('notification', p); }
  @OnEvent('auction.lost') handleAuctionLost(p: any) { console.log('Relaying auction.lost to:', p.forUserId); this.server.emit('notification', p); }
  @OnEvent('payment.received') handlePaymentReceived(p: any) { console.log('Relaying payment.received to:', p.forUserId); this.server.emit('notification', p); }
  @SubscribeMessage('joinAuction') handleJoinAuction(@MessageBody() carId: string, @ConnectedSocket() client: Socket) { client.join(`auction_${carId}`); }
  @SubscribeMessage('placeBid') async handlePlaceBid(@MessageBody() d: any, @ConnectedSocket() client: Socket) {
    try {
      const bid = await this.bidsService.placeBid(d.carId, d.userId, d.amount);
      this.server.to(`auction_${d.carId}`).emit('bidUpdate', bid);
      return { event: 'bidSuccess', data: bid };
    } catch (e) { return { event: 'bidError', message: e.message }; }
  }
  sendNotification(room: string | null, event: string, data: any) { room ? this.server.to(room).emit(event, data) : this.server.emit(event, data); }
}

// ==========================================
// 4. MORE SERVICES
// ==========================================

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel('Car') private carModel: Model<Car>, 
    @InjectModel('Bid') private bidModel: Model<Bid>,
    private cloudinaryService: CloudinaryService, 
    private bidsGateway: BidsGateway
  ) { }

  async onModuleInit() {
    // Check for ended auctions every 30 seconds (more frequent)
    console.log('Auction termination worker started.');
    setInterval(() => this.checkEndedAuctions(), 30000);
  }

  async checkEndedAuctions() {
    try {
      const expiredCars = await this.carModel.find({ 
        status: 'active', 
        endTime: { $lte: new Date() } 
      }).exec();

      if (expiredCars.length > 0) {
        console.log(`Found ${expiredCars.length} expired auctions.`);
      }

      for (const car of expiredCars) {
        car.status = 'ended';
        await car.save();

        const carObjectId = new Types.ObjectId(car._id.toString());
        console.log(`[AUCTION END] Car: ${car.make} ${car.modelName} | ID: ${carObjectId} | Seller: ${car.sellerId.toString()}`);

        // 1. Notify all users the auction has ended (global)
        this.bidsGateway.sendNotification(null, 'notification', {
          type: 'AUCTION_ENDED',
          message: `Auction for ${car.make} ${car.modelName} has ended!`,
          carId: car._id.toString()
        });

        // Find the winner and all bidders using explicit ObjectId
        const topBid = await this.bidModel.findOne({ carId: carObjectId }).sort({ amount: -1 }).exec();
        const allBidderIds = await this.bidModel.find({ carId: carObjectId }).distinct('userId').exec();

        console.log(`[AUCTION END] Top bid: ${topBid ? topBid.amount : 'NONE'} | Bidder count: ${allBidderIds.length}`);

        if (topBid) {
          const winnerId = topBid.userId.toString();
          const sellerId = car.sellerId.toString();

          console.log(`[AUCTION WIN] Winner ID: ${winnerId} | Seller ID: ${sellerId}`);

          // 2. Notify the winner specifically
          this.bidsGateway.sendNotification(null, 'notification', {
            type: 'AUCTION_WIN',
            message: `🏆 Congratulations! You won the auction for ${car.make} ${car.modelName} at $${topBid.amount}!`,
            carId: car._id.toString(),
            forUserId: winnerId
          });

          // 2b. Immediately follow up with payment reminder to winner
          setTimeout(() => {
            this.bidsGateway.sendNotification(null, 'notification', {
              type: 'PAYMENT_REQUIRED',
              message: `💳 Please complete your payment for ${car.make} ${car.modelName} to proceed with delivery!`,
              carId: car._id.toString(),
              forUserId: winnerId
            });
          }, 3000);

          // 3. Notify the seller specifically
          this.bidsGateway.sendNotification(null, 'notification', {
            type: 'AUCTION_ENDED',
            message: `Your auction for ${car.make} ${car.modelName} has ended. The winning bid was $${topBid.amount}. Winner ID: ${winnerId}`,
            carId: car._id.toString(),
            forUserId: sellerId
          });

          // 4. Notify all other bidders that they lost
          const otherBidders = (allBidderIds as any[]).filter(id => id.toString() !== winnerId);
          for (const rawLoserId of otherBidders) {
            const loserId = rawLoserId.toString();
            console.log(`[AUCTION LOST] Notifying loser: ${loserId}`);
            this.bidsGateway.sendNotification(null, 'notification', {
              type: 'AUCTION_LOST',
              message: `The auction for ${car.make} ${car.modelName} has ended. Unfortunately, you did not win this time.`,
              carId: car._id.toString(),
              forUserId: loserId
            });
          }
        } else {
          // No bids case
          console.log(`[AUCTION END] No bids found for car ${car._id}. Notifying seller.`);
          this.bidsGateway.sendNotification(null, 'notification', {
            type: 'AUCTION_ENDED',
            message: `Your auction for ${car.make} ${car.modelName} has ended with no bids.`,
            carId: car._id.toString(),
            forUserId: car.sellerId.toString()
          });
        }
      }
    } catch (err) {
      console.error('Error in checkEndedAuctions:', err);
    }
  }



  async createCar(carData: any, userId: string, files?: Array<Express.Multer.File>) {
    let imageUrls: string[] = [];
    if (files?.length) {
       try {
        const results = await Promise.all(files.map(file => this.cloudinaryService.uploadImage(file)));
        imageUrls = results.map(result => (result as any).secure_url);
       } catch (e) { console.error('Cloudinary upload failed:', e); }
    }
    const newCar = await new this.carModel({ ...carData, year: Number(carData.year), basePrice: Number(carData.basePrice), images: imageUrls.filter(u => u), sellerId: userId, currentBid: Number(carData.basePrice), endTime: new Date(carData.endTime) }).save();
    this.bidsGateway.sendNotification(null, 'notification', { type: 'NEW_CAR', message: `New car ${carData.make} ${carData.modelName} just added!`, carId: newCar._id.toString() });
    return newCar;
  }
  async findAll(query: any) {
    const { search, make, model, year, minPrice, maxPrice, category, bodyType } = query;
    const filter: any = {};
    if (search) filter.$or = [{ make: { $regex: search, $options: 'i' } }, { modelName: { $regex: search, $options: 'i' } }];
    if (make) filter.make = make;
    if (model) filter.modelName = model;
    if (year) filter.year = year;
    if (category) filter.category = category;
    if (bodyType) filter.bodyType = bodyType;
    if (minPrice || maxPrice) filter.$or = [{ currentBid: { $gte: Number(minPrice || 0), $lte: Number(maxPrice || Infinity) } }, { $and: [{ currentBid: { $exists: false } }, { basePrice: { $gte: Number(minPrice || 0), $lte: Number(maxPrice || Infinity) } }] }];
    return await this.carModel.find(filter).populate('sellerId', 'name email').exec();
  }
  async findOne(id: string) { return await this.carModel.findById(id).populate('sellerId', 'name email').exec(); }
  async getMetadata() { return { bodyTypes: await this.carModel.distinct('bodyType'), categories: await this.carModel.distinct('category') }; }
}

@Injectable()
export class ProfileService {
  constructor(@InjectModel('User') private userModel: Model<User>, @InjectModel('Car') private carModel: Model<Car>, @InjectModel('Bid') private bidModel: Model<Bid>) {}
  async getMe(userId: string) { return await this.userModel.findById(userId).select('-password').exec(); }
  async getMyCars(userId: string) { return await this.carModel.find({ sellerId: new Types.ObjectId(userId) }).exec(); }
  async getMyBids(userId: string) {
    const bids = await this.bidModel.find({ userId: new Types.ObjectId(userId) }).exec();
    return await Promise.all([...new Set(bids.map(b => b.carId.toString()))].map(async carId => ({ car: await this.carModel.findById(carId).exec(), myMaxBid: Math.max(...bids.filter(b => b.carId.toString() === carId).map(b => b.amount)) })));
  }
  async getWishlist(userId: string) { return (await this.userModel.findById(userId).populate('wishlist').exec()).wishlist; }
  async toggleWishlist(userId: string, carId: string) {
    const user = await this.userModel.findById(userId);
    const idx = user.wishlist.findIndex(id => id.toString() === carId);
    idx > -1 ? user.wishlist.splice(idx, 1) : user.wishlist.push(new Types.ObjectId(carId));
    await user.save();
    return user.wishlist;
  }
}

@Injectable()
export class PaymentsService {
  constructor(@InjectModel('Car') private carModel: Model<Car>, @InjectModel('Bid') private bidModel: Model<Bid>, private bidsGateway: BidsGateway) {}
  async processPayment(carId: string, userId: string) {
    const car = await this.carModel.findById(carId);
    if (!car) throw new BadRequestException('Car not found');
    const topBid = await this.bidModel.findOne({ carId }).sort({ amount: -1 }).exec();
    if (topBid?.userId.toString() !== userId) throw new BadRequestException('Only the winner can pay');
    car.status = 'sold';
    await car.save();
    
    // Notify Winner
    console.log(`Notifying winner of payment: ${userId.toString()}`);
    this.bidsGateway.sendNotification(null, 'notification', { 
      type: 'PAYMENT_COMPLETE', 
      message: `Great news! Your payment for ${car.make} ${car.modelName} is complete!`, 
      carId: car._id.toString(), 
      forUserId: userId.toString() 
    });

    // Notify Seller
    console.log(`Notifying seller of payment: ${car.sellerId.toString()}`);
    this.bidsGateway.sendNotification(null, 'notification', {
      type: 'PAYMENT_COMPLETE', // Using same type for bell styling
      message: `Payment received! You have successfully sold your ${car.make} ${car.modelName}.`,
      carId: car._id.toString(),
      forUserId: car.sellerId.toString()
    });

    return { message: 'Payment successful.', status: 'sold' };
  }
  async getPaymentDetails(carId: string) { return await this.carModel.findById(carId).populate('sellerId', 'name email').exec(); }
  async updateShippingStatus(carId: string, sellerId: string, status: string) {
    const car = await this.carModel.findById(carId);
    if (!car || car.sellerId.toString() !== sellerId.toString()) throw new ForbiddenException('Unauthorized');
    car.status = status;
    await car.save();
    const topBid = await this.bidModel.findOne({ carId }).sort({ amount: -1 }).exec();
    const winnerId = topBid?.userId?.toString();

    // Build a human-friendly message per status step
    const statusMessages: Record<string, string> = {
      sold: `✅ Payment confirmed! Your ${car.make} ${car.modelName} is being prepared for shipment.`,
      shipped: `🚚 Your ${car.make} ${car.modelName} is on its way! It has been shipped and is in transit.`,
      delivered: `📬 Your ${car.make} ${car.modelName} has been delivered! Enjoy your new car! 🎉`,
      completed: `🏁 Transaction for ${car.make} ${car.modelName} is fully completed. Thank you!`,
    };
    const message = statusMessages[status] || `Status updated to ${status} for ${car.make} ${car.modelName}.`;

    // Notify the winner about delivery progress via bell notification
    if (winnerId) {
      this.bidsGateway.sendNotification(null, 'notification', {
        type: `STATUS_UPDATE_${status.toUpperCase()}`,
        message,
        carId: car._id.toString(),
        forUserId: winnerId
      });
    }

    // Also notify the seller for their own records
    this.bidsGateway.sendNotification(null, 'notification', {
      type: `STATUS_UPDATE_${status.toUpperCase()}`,
      message: `📦 You marked ${car.make} ${car.modelName} as "${status}". The buyer has been notified.`,
      carId: car._id.toString(),
      forUserId: sellerId
    });

    // Emit deliveryUpdate to the auction room so payment page tracker updates in real-time
    this.bidsGateway.sendNotification(`auction_${car._id.toString()}`, 'deliveryUpdate', {
      status,
      carId: car._id.toString(),
      message
    });

    return { message: `Status updated to ${status}`, status };
  }
}

// ==========================================
// 5. GUARDS & STRATEGIES
// ==========================================

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, @InjectModel('User') private userModel: Model<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }
  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!authToken) throw new WsException('Unauthorized');
      const payload = await this.jwtService.verifyAsync(authToken);
      context.switchToHttp().getRequest().user = payload;
      return true;
    } catch (err) { throw new WsException('Unauthorized'); }
  }
}

// ==========================================
// 6. CONTROLLERS
// ==========================================

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register') async register(@Body() userData: any) { return this.authService.register(userData); }
  @Post('login') async login(@Body() loginData: any) { return this.authService.login(loginData); }
}

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) { }
  @Get('car/:carId') async getBidsForCar(@Param('carId') carId: string) { return this.bidsService.getBidsForCar(carId); }
  @UseGuards(JwtAuthGuard)
  @Post() async placeBid(@Body() bidData: any, @Req() req: any) { return this.bidsService.placeBid(bidData.carId, req.user._id, Number(bidData.amount)); }
}

@Controller('cars')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) { }
  @Get() async findAll(@Query() query: any) { return this.auctionService.findAll(query); }
  @Get('metadata') async getMetadata() { return this.auctionService.getMetadata(); }
  @Get(':id') async findOne(@Param('id') id: string) { return this.auctionService.findOne(id); }
  @UseGuards(JwtAuthGuard)
  @Post() @UseInterceptors(FilesInterceptor('images', 10)) async create(@Body() carData: any, @UploadedFiles() files: Array<Express.Multer.File>, @Req() req: any) { return this.auctionService.createCar(carData, req.user._id, files); }
}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }
  @Get('me') async getMe(@Req() req: any) { return this.profileService.getMe(req.user._id); }
  @Get('cars') async getMyCars(@Req() req: any) { return this.profileService.getMyCars(req.user._id); }
  @Get('bids') async getMyBids(@Req() req: any) { return this.profileService.getMyBids(req.user._id); }
  @Get('wishlist') async getWishlist(@Req() req: any) { return this.profileService.getWishlist(req.user._id); }
  @Post('wishlist/:carId') async toggleWishlist(@Req() req: any, @Param('carId') carId: string) { return this.profileService.toggleWishlist(req.user._id, carId); }
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }
  @UseGuards(JwtAuthGuard)
  @Post(':carId/pay') async pay(@Param('carId') carId: string, @Req() req: any) { return this.paymentsService.processPayment(carId, req.user._id); }
  @Get(':carId/details') async getDetails(@Param('carId') carId: string) { return this.paymentsService.getPaymentDetails(carId); }
  @UseGuards(JwtAuthGuard)
  @Post(':carId/shipping') async updateShippingPost(@Param('carId') carId: string, @Body() body: any, @Req() req: any) { return this.paymentsService.updateShippingStatus(carId, req.user._id, body.status); }
  @UseGuards(JwtAuthGuard)
  @Patch(':carId/status') async updateShippingPatch(@Param('carId') carId: string, @Body() body: any, @Req() req: any) { return this.paymentsService.updateShippingStatus(carId, req.user._id, body.status); }
}

// ==========================================
// 7. MODULES
// ==========================================

const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET }),
};

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]), PassportModule, JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (cs: ConfigService) => ({ secret: cs.get<string>('JWT_SECRET'), signOptions: { expiresIn: '7d' } }) })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
class AuthModule {}

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Bid', schema: BidSchema }, { name: 'Car', schema: CarSchema }]), AuthModule],
  controllers: [BidsController],
  providers: [BidsService, BidsGateway, WsJwtAuthGuard],
  exports: [BidsService, BidsGateway],
})
class BidsModule { }

@Module({ providers: [CloudinaryProvider, CloudinaryService], exports: [CloudinaryProvider, CloudinaryService] })
class CloudinaryModule {}

@Module({ imports: [MongooseModule.forFeature([{ name: 'Car', schema: CarSchema }, { name: 'Bid', schema: BidSchema }]), BidsModule], controllers: [PaymentsController], providers: [PaymentsService] })
class PaymentsModule {}

@Module({ imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }, { name: 'Car', schema: CarSchema }, { name: 'Bid', schema: BidSchema }])], controllers: [ProfileController], providers: [ProfileService] })
class ProfileModule {}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (cs: ConfigService) => ({ uri: cs.get<string>('MONGO_URI') }) }),
    AuthModule, BidsModule, PaymentsModule, ProfileModule, CloudinaryModule,
    MongooseModule.forFeature([{ name: 'Car', schema: CarSchema }, { name: 'Bid', schema: BidSchema }]),
  ],
  controllers: [AuctionController],
  providers: [AuctionService],
})
export class AppModule { }

// ==========================================
// 8. BOOTSTRAP
// ==========================================

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Bidding Backend (SUPER SINGULARITY) is running on: http://localhost:${port}`);
}
bootstrap();
