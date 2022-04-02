import {
  BadRequestException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { findKey, matchesProperty } from 'lodash';
import {
  DeviceType,
  UserDocument,
  PushToken,
} from 'src/users/models/_user.model';
import { UsersService } from 'src/users/users.service';
import { NotificationDocument } from './notification.model';
import {
  BaseMessageWithToken,
  BaseMessageWithTokenTesting,
  encodingDataForAllDevices,
  MessageBody,
  queryParamsWithId,
  SendNotificationMethod,
} from './Types';
import { NotificationRepository } from './notifications.repository';
import { PaginationParams } from 'src/utils/pagination/paginationParams.dto';
import {
  AnyObject,
  FilterQuery,
  OnlyFieldsOfType,
  _UpdateQueryDef,
} from 'mongoose';
import { UserRepository } from 'src/users/users.repository';
import { ServiceAccount } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService implements OnApplicationBootstrap {
  onApplicationBootstrap(): void {
    this.configurationHandler();
  }

  constructor(
    private readonly NotificationRepositary: NotificationRepository,
    private readonly UserRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  configurationHandler() {
    const adminConfig: ServiceAccount = {
      projectId: this.configService.get('projectId'),
      privateKey: this.configService.get('privateKey').replace(/\\n/g, '\n'),
      clientEmail: this.configService.get('clientEmail'),
    };
    // Initialize the firebase admin app
    admin.initializeApp({
      credential: admin.credential.cert(adminConfig),
      databaseURL: 'https://xxxxx.firebaseio.com',
    });
  }
  async sendManyNotificationsWithUserFilter(
    filter: FilterQuery<UserDocument>,
    message: MessageBody,
  ) {
    const userCounts = await this.UserRepository.fetchCounts(filter);

    let chunkCount = Math.ceil(userCounts / 5000);

    for (let i = 0; i < chunkCount; i++) {
      let users = await this.UserRepository.fetchUsersByFilter(filter, i);
      const usersIds = users.map((user) => user._id);
      let prmoises = [];
      await this.NotificationRepositary.create({
        title: message.title,
        body: message.body,
        targetUsers: usersIds,
      });

      for (let i = 0; i < users.length; i++) {
        prmoises.push(
          (users[i] as SendNotificationMethod).sendNotification(
            encodingDataForAllDevices(message),
          ),
        );
      }
      await Promise.all(prmoises);
    }
  }

  async sendMany(
    message: MessageBody,
    devices: {
      deviceToken: string;
      _id: string;
    }[],
  ): Promise<void> {
    let messagesWithTokens = devices.map((deviceData) => {
      return {
        ...encodingDataForAllDevices(message),
        token: deviceData.deviceToken,
      };
    });

    const chunckLength = 300;
    let slicesNumber = Math.ceil(messagesWithTokens.length / chunckLength); ///SLICES NUMBER
    let promises = [];

    for (let i = 0; i < slicesNumber; i++) {
      let MessageList = messagesWithTokens.slice(
        i * chunckLength,
        (i + 1) * chunckLength,
      );
      console.log(MessageList.length);
      promises.push(admin.messaging().sendAll(MessageList));
    }
    console.log(promises);
    await Promise.all(promises);
    console.log('Done Package');
  }

  async sendTest(message: BaseMessageWithTokenTesting): Promise<void> {
    await admin.messaging().send(message);
  }

  async unSubscribe(user: UserDocument, token: string) {
    if (token) {
      const index = findKey(
        user.pushTokens,
        matchesProperty('deviceToken', token),
      );

      if (index !== undefined) {
        user.pushTokens.splice(parseInt(index), 1);
        return await user.save();
      }
    }
  }
  async subscribe(
    user: UserDocument,
    deviceType: DeviceType,
    token: string,
    oldToken?: string,
  ) {
    if (oldToken) {
      const index = findKey(
        user.pushTokens,
        matchesProperty('deviceToken', oldToken),
      );
      if (index !== undefined) {
        user.pushTokens.splice(parseInt(index), 1);
      }
    }

    if (token) {
      const index = findKey(
        user.pushTokens,
        matchesProperty('deviceToken', token),
      );
      if (index === undefined) {
        user.pushTokens.push({
          deviceType: deviceType,
          deviceToken: token,
        } as PushToken);
      }
    }

    return await user.save();
  }

  async fetchAll(user: UserDocument, queryParams: PaginationParams) {
    (queryParams as queryParamsWithId).targetUsers = user._id;

    const notifications =
      await this.NotificationRepositary.findAllWithPaginationOption(
        queryParams,
        ['targetUsers'],
        { sort: '-createdAt', projection: { targetUsers: 0, readBy: 0 } },
      );

    await this.NotificationRepositary.updateAllVoid(
      { targetUsers: user._id },
      {
        $addToSet: { readBy: user._id } as OnlyFieldsOfType<
          _UpdateQueryDef<NotificationDocument>,
          any[],
          any
        > &
          AnyObject,
      },
    );
    return notifications;
  }

  async fetchCount(user: UserDocument): Promise<{ count: number }> {
    const count = await this.NotificationRepositary.countNotifications(user);
    return { count: count };
  }
}
