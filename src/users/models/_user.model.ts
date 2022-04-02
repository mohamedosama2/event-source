import {
  Prop,
  Schema,
  SchemaFactory,
  DiscriminatorOptions,
  raw,
} from '@nestjs/mongoose';
import { Document, Model, ObjectId, AcceptsDiscriminator } from 'mongoose';
import { UnprocessableEntityException } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';
import { Constants } from '../../utils/constants';
import { Password } from '../../auth/utils/Password';
import * as admin from 'firebase-admin';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  TEACHER = 'teacher',
}

export enum DeviceType {
  android = 'android',
  ios = 'ios',
  web = 'web',
}

export interface PushToken {
  deviceType: DeviceType;
  deviceToken: string;
}

@Schema({
  discriminatorKey: 'role',
  timestamps: true,
  toJSON: {
    getters: true,
    virtuals: true,
    transform: (_, doc: Record<string, unknown>) => {
      delete doc.__v;
      delete doc._id;
      delete doc.password;
      return {
        ...doc,
      };
    },
  },
})
export class User {
  id?: string;
  @Prop({
    index: true,
    unique: true,
    sparse: true,
    match: Constants.EMAIL_REGX,
  })
  email: string;

  @Prop({
    index: true,
    unique: true,
    sparse: true,
    match: Constants.PHONE_REGX,
  })
  phone: string;

  @Prop({
    get: (username: string) => {
      return username.toUpperCase();
    },
    set: (username: string) => {
      return username.trim();
    },
    required: true,
    index: true,
  })
  username: string;

  @Prop(String)
  password: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  photo: string;

  @Prop({ index: true, unique: true, sparse: true })
  facebookId: string;

  @Prop({ index: true, unique: true, sparse: true })
  googleId: string;

  @Prop({ required: true, type: String, enum: Object.values(UserRole) })
  role: UserRole;

  @Prop(Number)
  rating?:number;

  @Prop(
    raw([
      {
        _id: false,
        deviceType: {
          type: String,
          enum: ['android', 'ios', 'web'],
          required: true,
        },
        deviceToken: {
          type: String,
          required: true,
        },
      },
    ]),
  )
  pushTokens: PushToken[];
}

const UserSchema = SchemaFactory.createForClass(User);

// UserSchema.virtual('NameAndEmail').get(function (this: UserDocument) {
//   return `${this.email} + ${this.username}`;
// });

UserSchema.pre('save', async function () {
  const user = this;

  let nullableFields = ['phone', 'email', 'googleId', 'facebookId'];
  for (let i = 0; i < nullableFields.length; i++) {
    if (user.isModified(nullableFields[i])) {
      const value = user[nullableFields[i]];
      if (value === '' || value === null) user[nullableFields[i]] = undefined;
    }
  }

  let uniqueFields = ['phone', 'apple_id', 'fb_id', 'email'];
  for (let i = 0; i < uniqueFields.length; i++) {
    if (user.isModified(uniqueFields[i])) {
      // be true if was undefined then set value to it , be false if same value set to it
      let value = user[uniqueFields[i]];
      if (value === undefined) continue;
      let filter = {};
      filter[uniqueFields[i]] = value;
      let model = <Model<User>>this.constructor;
      let count = await model.countDocuments(filter);
      if (count) {
        throw new UnprocessableEntityException(
          `${uniqueFields[i]} : ${value} is not a uniqu value`,
        );
      }
    }
  }
  if ((this as UserDocument).password && this.isModified('password')) {
    // (this as UserDocument).password = await hash(
    //   (this as UserDocument).password,
    //   10,
    // );
    (this as UserDocument).password = await Password.hash(
      (this as UserDocument).password,
    );
  }
});

//Notificiation

UserSchema.methods.sendNotification = async function (message) {
  const user = this;
  let changed = false;
  let len = user['pushTokens'].length;

  while (len--) {
    const deviceToken = user['pushTokens'][len].deviceToken;

    message.token = deviceToken;
    try {
      await admin.messaging().send(message);
      console.log('successfully');
    } catch (error) {
      user['pushTokens'].splice(len, 1);
      changed = true;
    }
  }
  if (changed) await this.save();
};

UserSchema.methods.isValidPassword = async function (password) {
  // return compare(password, (this as UserDocument).password);
  return Password.isCorrectPassword(password, (this as UserDocument).password);
};

export { UserSchema };
