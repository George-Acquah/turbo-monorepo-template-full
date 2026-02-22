import { Request } from 'express';
import { RequestContext } from './interfaces';

export type AppRequest = Request & RequestContext;

export type { Response, NextFunction } from 'express';
