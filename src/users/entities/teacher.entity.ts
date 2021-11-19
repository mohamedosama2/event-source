import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeacherDocument = Teacher & Document;

@Schema()
export class Teacher {
  role: string;
}

const TeacherSchema = SchemaFactory.createForClass(Teacher);

export { TeacherSchema };
