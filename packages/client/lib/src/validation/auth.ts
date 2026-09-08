import { z } from 'zod';

// Mirrors modules/auth/src/presentation/dto/register.dto.ts
export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  turnstileToken: z.string().min(1, 'Please complete the security check.'),
});

// Mirrors modules/auth/src/presentation/dto/claim-account.dto.ts
export const claimAccountSchema = z.object({
  claimToken: z.string().min(1, 'Claim token is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

// Mirrors modules/auth/src/presentation/dto/login.dto.ts
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  turnstileToken: z.string().min(1, 'Please complete the security check.'),
});
