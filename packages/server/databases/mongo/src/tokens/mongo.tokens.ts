import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

export const MONGO_DB_CLIENT_TOKEN = Symbol('MONGO_DB_CLIENT_TOKEN');

// Keep default connection for now; set this to a name later to move to named connections.
export const MONGO_CONNECTION_NAME: string | undefined = undefined;

export function getMongoConnectionToken(): string {
  return MONGO_CONNECTION_NAME
    ? getConnectionToken(MONGO_CONNECTION_NAME)
    : getConnectionToken();
}

export function getMongoModelToken(modelName: string): string {
  return MONGO_CONNECTION_NAME
    ? getModelToken(modelName, MONGO_CONNECTION_NAME)
    : getModelToken(modelName);
}
