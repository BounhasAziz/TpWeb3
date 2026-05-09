import { IsArray, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @IsUrl()
  url: string;

  @IsString()
  @IsNotEmpty()
  secret: string;

  @IsArray()
  @IsString({ each: true })
  events: string[];
}
