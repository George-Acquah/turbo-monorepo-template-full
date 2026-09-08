import type { Routes } from '@nestjs/core';
import { RouteVersionKey } from '@workspace/constants';

/**
 * ModuleRoute is a type that represents a mapping of route versions to their corresponding route configurations. Each key in the record corresponds to a specific version of the API (e.g., 'v1', 'v2'), and the value is an array of route configurations for that version. This allows for organizing and managing routes based on different API versions, facilitating versioning and backward compatibility in the application.
 */
export type ModuleRoutes = Partial<Record<RouteVersionKey, Array<Routes[number]>>>;
