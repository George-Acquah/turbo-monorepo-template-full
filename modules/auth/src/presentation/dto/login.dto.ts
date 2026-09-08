import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

// Documents the shape EmailPasswordStrategy (@workspace/auth-core) reads off the
// request body — LocalAuthGuard runs the strategy before this DTO would
// otherwise be validated, so this exists for Swagger schema generation, not
// as an active ValidationPipe target.
export class LoginDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'a-strong-password' })
  @IsString()
  password!: string;

  // Same caveat as email/password above: Swagger-documentation-only for this
  // route. Actual enforcement happens in `TurnstileGuard`, which reads
  // `req.body.turnstileToken` directly before LocalAuthGuard's strategy runs.
  @ApiProperty({ example: 'a-turnstile-token' })
  @IsString()
  turnstileToken!: string;
}
