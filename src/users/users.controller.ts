import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Inject,
  UseFilters,
  UploadedFiles,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  HttpCode,
  Query,
  CacheInterceptor,
  CacheKey,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { request } from 'http';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument, UserRole } from './models/_user.model';
import { UsersService } from './users.service';
import { REQUEST } from '@nestjs/core';
import { AuthUser } from 'src/auth/decorators/me.decorator';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';
import { PaginationParams } from 'src/utils/pagination/paginationParams.dto';
import ParamsWithId from 'src/utils/paramsWithId.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { FilterQuery, PaginateResult } from 'mongoose';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiOkResponseGeneral } from 'src/utils/pagination/apiOkResponseGeneral';
import { Student } from './models/student.model';
import { Teacher } from './models/teacher.model';
import { FilterQueryOptionsUser } from './dto/filterQueryOptions.dto';
import { UserRepository } from './users.repository';
import { Constants } from 'src/utils/constants';
import { CreateRateDto } from 'src/rate/dto/create-rate.dto';
import { RateService } from 'src/rate/rate.service';

// @ApiBearerAuth()
@ApiTags('USERS')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rateService: RateService,
    private readonly UserRepository: UserRepository,
    @Inject(REQUEST) private readonly req: Record<string, unknown>,
  ) {}

  @Public()
  @Post('lato')
  async insertyion() {
    return await this.usersService.createUser({
      phone: '+201021219333',
      username: 'momaoomaa',
      password: '11112222',
      // email:"lato@gmail.com",
      role: UserRole.STUDENT,
      enabled:true
    });
  }

  /*   @Roles(UserRole.STUDENT) */
  @Post('/rate/:id')
  async addRate(
    @Body() createRateDto: CreateRateDto,
    @Param() { id }: ParamsWithId,
    @AuthUser() me: UserDocument,
  ) {
    return await this.rateService.create(createRateDto, 'users', id, me._id);
  }

  @Get('/rates/:id')
  async getAllRates(
    @Param() { id }: ParamsWithId,
    @Query() PaginationParams: PaginationParams,
  ) {
    return await this.rateService.fetchAllRates(PaginationParams, 'users', id);
  }

  // @Roles(UserRole.STUDENT)
  // @CacheKey(Constants.GET_POSTS_CACHE_KEY)
  @Public()
  @ApiOkResponseGeneral(User)
  @Get()
  async findAll(
    @Query() queryFiltersAndOptions: FilterQueryOptionsUser,
  ): Promise<PaginateResult<UserDocument> | UserDocument[]> {
    return await this.usersService.findAll(
      queryFiltersAndOptions as FilterQueryOptionsUser,
    );
  }

  @Get('profile')
  async getProfile(): Promise<UserDocument> {
    return await this.usersService.getProfile(this.req.me as UserDocument);
  }

  @Patch('profile')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  async updateProfile(
    @UploadedFiles()
    files,
    @Body() updateUserData: UpdateUserDto,
  ): Promise<UserDocument> {
    if (files && files.photo) updateUserData.photo = files.photo[0].secure_url;

    delete updateUserData.enabled;

    return await this.usersService.update(
      { _id: this.req.me } as FilterQuery<UserDocument>,
      updateUserData,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/change-password')
  async changePassword(
    @Body() { oldPassword, newPassword }: ChangePasswordDto,
    @AuthUser() me: UserDocument,
  ): Promise<UserDocument> {
    return await this.usersService.changePassword(
      { oldPassword, newPassword },
      me,
    );
  }

  @Public()
  @Get(':id')
  async fetchUserById(@Param() { id }: ParamsWithId): Promise<UserDocument> {
    return await this.usersService.findOne({
      _id: id,
    } as FilterQuery<UserDocument>);
  }
}
