// import { UserPersistence } from '@/database';
// import { TwoFactorMethod } from '@workspace/constants';
// import { TokenPair } from '@workspace/types';

// /**
//  * 2FA challenge response when user has 2FA enabled
//  */
// interface TwoFAChallengeResponse {
//   mfaToken: string;
//   mfaMethods: TwoFactorMethod[];
//   requiresMfa: true;
// }

// interface LoginSuccessReponse {
//   user: Pick<
//     UserPersistence,
//     | 'id'
//     | 'email'
//     | 'phone'
//     | 'firstName'
//     | 'lastName'
//     | 'displayName'
//     | 'avatarUrl'
//     | 'userType'
//     | 'status'
//     | 'emailVerified'
//     | 'twoFactorEnabled'
//   >;
//   tokens: TokenPair;
//   requiresMfa: false;
// }

// /**
//  * Login response: either LoginSuccessResponse or 2FA challenge
//  */
// export type LoginResponse = LoginSuccessReponse | TwoFAChallengeResponse;
// export abstract class AuthServicePort {
//   abstract loginWithEmail(email: string, password: string): Promise<LoginResponse>;
//   abstract refresh(rawRefreshToken?: string): Promise<TokenPair>;
//   abstract logout(userId?: string): Promise<void>;
// }

// export const AUTH_SERVICE_PORT = Symbol('AUTH_SERVICE_PORT');
