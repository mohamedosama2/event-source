import { NotFoundException } from '@nestjs/common';
import { EventBus, EventPublisher } from '@nestjs/cqrs';
import * as _ from 'lodash';
import {
  CreateQuery,
  FilterQuery,
  UpdateQuery,
  Model,
  Document,
  PaginateOptions,
  PaginateModel,
  PaginateResult,
  QueryOptions,
} from 'mongoose';
import { VersionedAggregateRoot } from 'src/shared/domain/aggregate-root';
import { v4 as uuidv4 } from 'uuid';

type TDocument<T> = T & Document;
export abstract class BaseAbstractRepository<T> extends VersionedAggregateRoot {
  private model: Model<TDocument<T>>;
  private eventBus: EventBus;
  private eventPublisher: EventPublisher;

  constructor(
    model?: Model<TDocument<T>>,
    eventBus?: EventBus,
    eventPublisher?: EventPublisher,
  ) {
    super();
    this.model = model;
    this.eventBus = eventBus;
    this.eventPublisher = eventPublisher;
  }

  public async create(data: CreateQuery<TDocument<T>>): Promise<TDocument<T>> {
    const newDocument = new this.model(data).save();
    // this.eventPublisher.mergeObjectContext()
    // newDocument.publish("Hello")

    return newDocument;
  }
  public async createDoc(data: T): Promise<TDocument<T>> {
    const newDocument = await new this.model(data).save();
    this.eventPublisher.mergeObjectContext(this);
    this.apply({
      ...newDocument,
      meta: {
        id: uuidv4(),
        version: this.version,
        modelName: this.model.modelName,
        type: 'insertOne',
      },
    });
    this.commit();
    return newDocument;
  }
  public async insertMany(data) {
    const newDocument = await this.model.insertMany(data);
    this.eventPublisher.mergeObjectContext(this);
    this.apply({
      ...newDocument,
      meta: {
        id: uuidv4(),
        version: this.version,
        modelName: this.model.modelName,
        type: 'insertMany',
      },
    });
    this.commit();
    return newDocument;
  }

  public async findOne(
    filterQuery: FilterQuery<TDocument<T>>,
    options: QueryOptions = {},
    projection: any = {},
  ): Promise<TDocument<T>> {
    const doc = await this.model
      .findOne(filterQuery, projection)
      .setOptions(options);
    return doc;
  }

  public async findAllWithPaginationOption(
    queryFiltersAndOptions: any,
    arrayOfFilters: string[],
    extraOptions: PaginateOptions = {},
  ): Promise<PaginateResult<TDocument<T>> | TDocument<T>[]> {
    const filters: FilterQuery<TDocument<T>> = _.pick(
      queryFiltersAndOptions,
      arrayOfFilters,
    );
    const options: PaginateOptions = _.pick(queryFiltersAndOptions, [
      'page',
      'limit',
    ]);
    let docs;
    if (queryFiltersAndOptions.allowPagination) {
      docs = await (this.model as PaginateModel<TDocument<T>>).paginate(
        filters,
        { ...options, ...extraOptions },
      );
    } else {
      docs = await this.model.find(filters).setOptions(options);
    }
    return docs;
  }

  public async deleteOne(
    filterQuery: FilterQuery<TDocument<T>>,
  ): Promise<void> {
    await this.model.deleteOne(filterQuery);
  }

  public async updateOne(
    filterQuery: FilterQuery<TDocument<T>>,
    updateQuery: UpdateQuery<TDocument<T>>,
    options: QueryOptions = {},
    projection: any = {},
  ): Promise<TDocument<T>> {
    const doc = await this.model
      .findOne(filterQuery, projection)
      .setOptions(options);
    if (!doc) throw new NotFoundException(`${this.model.modelName} not found`);
    await doc.set(updateQuery).save();
    return doc;
  }

  public async updateOneVoid(
    filterQuery: FilterQuery<TDocument<T>>,
    updateQuery: UpdateQuery<TDocument<T>>,
    options: QueryOptions = {},
  ): Promise<void> {
    await this.model.updateOne(filterQuery, updateQuery);
  }
  public async updateAllVoid(
    filterQuery: FilterQuery<TDocument<T>>,
    updateQuery: UpdateQuery<TDocument<T>>,
    options: QueryOptions = {},
  ): Promise<void> {
    await this.model.updateMany(filterQuery, updateQuery);
  }
}
