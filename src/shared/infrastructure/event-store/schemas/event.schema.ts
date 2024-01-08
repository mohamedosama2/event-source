import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
})
export class Event {
  @Prop()
  streamId: string;

  @Prop()
  type: string;

  @Prop()
  modelName: string;

  @Prop()
  position: number;

  @Prop()
  methodName: string;

  @Prop({
    type: SchemaTypes.Mixed,
  })
  data: Record<string, any>;
  @Prop({
    type: SchemaTypes.Mixed,
  })
  param1: Record<string, any>;
  @Prop({
    type: SchemaTypes.Mixed,
  })
  param2: Record<string, any>;
  @Prop({
    type: SchemaTypes.Mixed,
  })
  param3: Record<string, any>;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ streamId: 1, position: 1 }, { unique: true });
