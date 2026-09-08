import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ClaimAccountDto {
  @ApiProperty({ description: 'The raw claim token from the "set up your account" email.' })
  @IsString()
  claimToken!: string;

  @ApiProperty({ example: 'a-strong-password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
