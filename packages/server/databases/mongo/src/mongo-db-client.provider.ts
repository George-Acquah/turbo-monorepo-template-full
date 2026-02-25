import { Provider } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  EVENTS_MODEL_NAMES,
  EventModels,
  IdempotencyKeyDocument,
  OutboxEventDocument,
  SagaStateDocument,
  UserModels,
  USERS_MODEL_NAMES,
  AddressDocument,
  EmailVerificationTokenDocument,
  PasswordResetTokenDocument,
  UserAuthProviderDocument,
  UserDocument,
  UserPreferenceDocument,
  UserSessionDocument,
} from './schemas';
import { getMongoModelToken, MONGO_DB_CLIENT_TOKEN } from './tokens/mongo.tokens';

export interface MongoDbClient {
  users: UserModels;
  events: EventModels;
}

export const mongoDbClientProvider: Provider = {
  provide: MONGO_DB_CLIENT_TOKEN,
  inject: [
    getMongoModelToken(USERS_MODEL_NAMES.user),
    getMongoModelToken(USERS_MODEL_NAMES.address),
    getMongoModelToken(USERS_MODEL_NAMES.userAuthProvider),
    getMongoModelToken(USERS_MODEL_NAMES.userPreference),
    getMongoModelToken(USERS_MODEL_NAMES.userSession),
    getMongoModelToken(USERS_MODEL_NAMES.passwordResetToken),
    getMongoModelToken(USERS_MODEL_NAMES.emailVerificationToken),
    getMongoModelToken(EVENTS_MODEL_NAMES.outboxEvent),
    getMongoModelToken(EVENTS_MODEL_NAMES.idempotencyKey),
    getMongoModelToken(EVENTS_MODEL_NAMES.sagaState),
  ],
  useFactory: (
    user: Model<UserDocument>,
    address: Model<AddressDocument>,
    userAuthProvider: Model<UserAuthProviderDocument>,
    userPreference: Model<UserPreferenceDocument>,
    userSession: Model<UserSessionDocument>,
    passwordResetToken: Model<PasswordResetTokenDocument>,
    emailVerificationToken: Model<EmailVerificationTokenDocument>,
    outboxEvent: Model<OutboxEventDocument>,
    idempotencyKey: Model<IdempotencyKeyDocument>,
    sagaState: Model<SagaStateDocument>,
  ): MongoDbClient => ({
    users: {
      user,
      address,
      userAuthProvider,
      userPreference,
      userSession,
      passwordResetToken,
      emailVerificationToken,
    },
    events: {
      outboxEvent,
      idempotencyKey,
      sagaState,
    },
  }),
};
