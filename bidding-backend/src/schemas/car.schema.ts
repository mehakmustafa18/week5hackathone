import { Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Car extends Document {
  @Prop({ required: true }) make: string;
  @Prop({ required: true }) modelName: string;
  @Prop({ required: true }) year: number;
  @Prop({ required: true }) basePrice: number;
  @Prop({ default: 0 }) currentBid: number;
  @Prop({ required: true }) bodyType: string; // sedan, sports, etc.
  @Prop({ required: true }) images: string[];
  @Prop({ required: true }) category: string; // car, truck, etc.
  @Prop({ required: true }) description: string;
  @Prop({ required: true }) endTime: Date; // Auction end time
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) sellerId: Types.ObjectId;
  @Prop({ default: 'active' }) status: string; // active, sold, shipped, delivered, completed
}
export const CarSchema: MongooseSchema = SchemaFactory.createForClass(Car);