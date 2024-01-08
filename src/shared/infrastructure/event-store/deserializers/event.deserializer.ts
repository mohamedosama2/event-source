import { Injectable, Type } from '@nestjs/common';
import { SerializableEvent } from '../../../domain/interfaces/serializable-event';
import { Event } from '../schemas/event.schema';
import { User, UserDocument } from 'src/users/models/_user.model';
import { UsersService } from 'src/users/users.service';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class EventDeserializer {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async applyModelLogicFromEvents(event) {
    const currentModel = this.connection.model('User');
    await currentModel[event.methodName](
      event.param1,
      event.param2,
      event.param3,
    );
  }


}
