// TEMPLATE NOTE: `./auth` is the one example slice — mirror each of your
// backend DTOs with a zod schema in its own file here and re-export it.
export { registerSchema, claimAccountSchema, loginSchema } from './auth';
