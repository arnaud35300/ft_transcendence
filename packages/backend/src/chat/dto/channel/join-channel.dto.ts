// NestJS imports
import { ApiProperty } from '@nestjs/swagger';

// Third-party imports
import { IsOptional, IsString } from 'class-validator';

export class JoinChannelDto {
  @ApiProperty({
    description: 'The password of the channel',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;
}