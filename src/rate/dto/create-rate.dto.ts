import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserDocument } from 'src/users/models/_user.model';

export class CreateRateDto {
/*   @IsMongoId()
  @IsNotEmpty()
  user: string | UserDocument; */

  @IsNumber()
  @IsNotEmpty()
  rating: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
