// The single source of the account shape is `getAccount()` in the shared API layer;
// re-export it so entities/widgets and the fetch site can't drift into two "unrelated"
// aliases of the same generated schema.
export type { Account } from '@/shared/api';
