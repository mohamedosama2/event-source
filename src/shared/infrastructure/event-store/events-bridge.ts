import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ChangeStream } from 'mongodb';
import { Connection, Model } from 'mongoose';
import { EVENT_STORE_CONNECTION } from '../../../core/core.constants';
import { Event, EventDocument, EventSchema } from './schemas/event.schema';
import { EventDeserializer } from './deserializers/event.deserializer';

@Injectable()
export class EventsBridge
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private changeStream;
  private readonly logger = new Logger('Change Stream');

  constructor(
    @InjectModel(Event.name)
    private readonly eventStore: Model<Event>,
    private readonly eventBus: EventBus,
    private readonly eventDeserializer: EventDeserializer,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onApplicationBootstrap() {
    // In the poll-based approach, instead of using a change stream (as we're doing here), we would periodically
    // poll the event store for new events. To keep track of what events we already processed,
    // we would need to store the last processed event (cursor) in a separate collection.
    this.changeStream = this.eventStore.watch().on('change', (change) => {
      if (change.operationType === 'insert') {
        this.handleEventStoreChange(change);
      }
    });
  }

  onApplicationShutdown() {
    return this.changeStream.close();
  }

  handleEventStoreChange(change) {
    // "ChangeStreamInsertDocument" object exposes the "txnNumber" property, which represents
    // the transaction identifier. If you need multi-document transactions in your application,
    // you can use this property to achieve atomicity.
    const insertedEvent = change.fullDocument;
    this.logger.debug('Change Stream Is Working');
    // console.log(this.connection.models['users'].cre)
    // const eventInstance =
    //   this.eventDeserializer.applyModelLogicFromEvents(insertedEvent);
    // this.eventBus.subject$.next( eventInstance['data']);
  }
}
