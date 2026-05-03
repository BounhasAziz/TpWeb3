import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCvDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsNumber()
  age: number;

  @IsString()
  @IsNotEmpty()
  cin: string;

  @IsString()
  @IsNotEmpty()
  job: string;

  @IsString()
  @IsOptional()
  path?: string;
}
