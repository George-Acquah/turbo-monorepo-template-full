import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  email!: string | null;

  @ApiProperty({ type: String, nullable: true })
  firstName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  lastName!: string | null;

  @ApiProperty()
  userType!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  emailVerified!: boolean;
}
