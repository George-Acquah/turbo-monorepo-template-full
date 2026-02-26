// grafana.config.ts
import { registerAs } from '@nestjs/config';

export const GrafanaConfigKey = 'GRAFANA_CONFIG';

const toBool = (v: string | undefined, fallback = false) => {
  if (v == null) return fallback;
  return ['true', '1', 'yes', 'y', 'on'].includes(v.toLowerCase());
};

export const GrafanaConfig = registerAs(GrafanaConfigKey, () => ({
  lokiUrl: process.env.GRAFANA_CLOUD_LOKI_URL,
  lokiUser: process.env.GRAFANA_CLOUD_LOKI_USER,
  lokiPassword: process.env.GRAFANA_CLOUD_LOKI_PASSWORD,

  prometheusUrl: process.env.GRAFANA_CLOUD_PROMETHEUS_URL,
  prometheusUser: process.env.GRAFANA_CLOUD_PROMETHEUS_USER,
  prometheusPassword: process.env.GRAFANA_CLOUD_PROMETHEUS_PASSWORD,

  localLokiHost: process.env.LOCAL_LOKI_HOST ?? 'http://172.17.0.1:3100',

  enableLoki: toBool(process.env.ENABLE_LOKI, false),

  appName: process.env.GRAFANA_APP_NAME ?? 'TEMPLATE',
  env: process.env.GRAFANA_ENV ?? 'development',
  appVersion: process.env.GRAFANA_APP_VERSION ?? 'v1.0.0',
  instance: process.env.GRAFANA_INSTANCE,
  logLevel: process.env.LOG_LEVEL,
}));
