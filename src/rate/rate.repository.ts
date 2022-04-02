import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseAbstractRepository } from 'src/utils/base.abstract.repository';
import { Rate, RateDocument } from './rate.model';

@Injectable()
export class RateRepository extends BaseAbstractRepository<Rate> {
  constructor(
    @InjectModel(Rate.name)
    private rateModel: Model<RateDocument>,
  ) {
    super(rateModel);
  }
  async fetchRates(ratedObjectId: string, subjectType: string) {
    let rates = await this.rateModel.aggregate([
      {
        $match: {
          subject: new Types.ObjectId(ratedObjectId),
          subjectType,
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $addFields: {
          multiplication: { $multiply: ['$count', '$_id'] },
        },
      },
      {
        $group: {
          _id: null,
          numerator: { $sum: '$multiplication' },
          denominator: { $sum: '$count' },
        },
      },
      {
        $addFields: {
          final: { $divide: ['$numerator', '$denominator'] },
        },
      },
    ]);
    console.log('Fetch Rates', rates);
    return rates;
  }
}
