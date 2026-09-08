export abstract class PrismaHealthPort {
  abstract checkPrismaDb(): Promise<void>;
}

export const PRISMA_HEALTH_PORT_TOKEN = Symbol('PRISMA_HEALTH_PORT_TOKEN');
export const HEALTH_PORT_TOKEN = Symbol('HEALTH_PORT_TOKEN');
