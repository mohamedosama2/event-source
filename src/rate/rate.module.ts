import { forwardRef, Module } from '@nestjs/common';
import { RateService } from './rate.service';
import { RateController } from './rate.controller';
import { RateRepository } from './rate.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Rate, RateSchema } from './rate.model';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [RateController],
  providers: [RateService, RateRepository],
  exports: [RateService, RateRepository],
  imports: [
    MongooseModule.forFeature([{ schema: RateSchema, name: Rate.name }]),
    forwardRef(() =>  UsersModule),
  ],
})
export class RateModule {}
