import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User, UserDocument } from 'src/users/models/_user.model';

export type RateDocument = Rate & Document;

@Schema({
  timestamps: true,
})
export class Rate {
  @Prop({ type: Types.ObjectId, refPath: 'subjectType', required: true })
  subject: string | Types.ObjectId;

  @Prop({ type: String, enum: ['video', 'gym', 'users'], required: true })
  subjectType: string;

  @Prop({
    type: Types.ObjectId,
    autopopulate: true,
    ref: User.name,
    required: true,
  })
  user: string | UserDocument;

  @Prop({ type: Number, required: true })
  rating?: number;

  @Prop(String)
  feedback?: string;
}

export const RateSchema = SchemaFactory.createForClass(Rate);
