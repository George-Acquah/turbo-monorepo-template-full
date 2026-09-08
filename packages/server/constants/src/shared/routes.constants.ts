export const routeVersionKeys = {
  v1: 'v1',
} as const;

export type RouteVersionKey = (typeof routeVersionKeys)[keyof typeof routeVersionKeys];
