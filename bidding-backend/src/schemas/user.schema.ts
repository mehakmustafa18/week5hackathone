import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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