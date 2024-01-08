import { Injectable } from '@nestjs/common';
import { VersionedAggregateRoot } from '../../../domain/aggregate-root';
import { SerializableEvent } from '../../../domain/interfaces/serializable-event';

@Injectable()
export class EventSerializer {
  serialize<T>(
    event: T,
    dispatcher: VersionedAggregateRoot,
  ): SerializableEvent<T> {
    const modelName = event['meta']['modelName'];
    const eventType = event['meta']['type'];
    if (!modelName) {
      throw new Error('Model Name Not Found');
    }
    if (!eventType) {
      throw new Error('Model Name Not Found');
    }
    const aggregateId = event['meta']['id'];
    return {
      streamId: aggregateId,
      position: dispatcher.version.value + 1,
      type: eventType,
      modelName: modelName,
      data: this.toJSON(event),
      methodName: event['meta']['methodName'],
      param1: event['meta']['param1'],
      param2: event['meta']['param2'],
      param3: event['meta']['param3'],
    };
  }

  private toJSON(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if ('toJSON' in data && typeof data.toJSON === 'function') {
      return data.toJSON();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.toJSON(item));
    }

    return Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = this.toJSON(value);
      return acc;
    }, {});
  }
}
