import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FilterUserDto } from 'src/users/dto/filter-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as jwt from 'jsonwebtoken';
import TokenPayload from './interfaces/tokenPayload.interface';
import { LoginGoogleDto } from './dto/login-google.dto';
import { User } from 'src/users/entities/_user.entity';
import { LoginFacebookDto } from './dto/login-facebook.dto';
import axios from 'axios';
import CreateUserDto from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerationData: RegisterDto) {
    let user = await this.userService.register(registerationData);
    return user;
  }

  async login(loginDto: LoginDto) {
    const { phone } = loginDto;
    let user = await this.userService.findOne({ phone } as FilterUserDto);
    if (!user) throw new UnauthorizedException('invalid credentials');
    if (!(await (user as any).isValidPassword(loginDto.password)))
      throw new UnauthorizedException('invalid credentials');

    if (user.enabled === false)
      throw new UnauthorizedException('your account is deactivated');
    const payload: TokenPayload = {
      userId: user.id,
    };
    const options = {};
    const token = jwt.sign(payload, process.env.JWT_SECRET, options);
    return { user, token };
  }

  async loginGoogle(user: User) {
    return user;
  }

  async loginFacebook({ accessToken }: LoginFacebookDto) {
    const { data } = await axios(
      `${this.configService.get<string>(
        'facebookUrl',
      )}&access_token=${accessToken}`,
    );
    const { id, name, email } = data;
    let user = await this.userService.findOne({
      facebookId: id,
    } as FilterUserDto);
    if (!user) {
      user = await this.userService.createUser({
        username: name,
        email,
        facebookId: id,
        role: 'Student',
      } as CreateUserDto);
    }
    return user;
  }
}