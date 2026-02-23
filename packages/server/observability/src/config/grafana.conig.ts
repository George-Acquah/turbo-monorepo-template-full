import { ConfigService, registerAs } from '@nestjs/config';

export interface IGrafanaConfig {
  enableLoki: boolean;
  lokiUrl?: string;
  lokiUser?: string;
  lokiPassword?: string;
  prometheusUrl?: string;
  prometheusUser?: string;
  prometheusPassword?: string;
  localLokiHost?: string;
  appName: string;
  env: string;
  appVersion: string;
  instance?: string;
}

export const grafanaConfigKey = 'LOKI_CONFIG';

const grafanaConfigFactory = (config: ConfigService): IGrafanaConfig => ({
  lokiUrl: config.get<string>('GRAFANA_CLOUD_LOKI_URL'),
  lokiUser: config.get<string>('GRAFANA_CLOUD_LOKI_USER'),
  lokiPassword: config.get<string>('GRAFANA_CLOUD_LOKI_PASSWORD'),
  prometheusUrl: config.get<string>('GRAFANA_CLOUD_PROMETHEUS_URL'),
  prometheusUser: config.get<string>('GRAFANA_CLOUD_PROMETHEUS_USER'),
  prometheusPassword: config.get<string>('GRAFANA_CLOUD_PROMETHEUS_PASSWORD'),
  localLokiHost: config.get<string>('LOCAL_LOKI_HOST', 'http://172.17.0.1:3100'),
  enableLoki: config.get<boolean>('ENABLE_LOKI', false),
  appName: config.get<string>('GRAFANA_APP_NAME', 'TEMPLATE'),
  env: config.get<string>('GRAFANA_ENV', 'development'),
  appVersion: config.get<string>('GRAFANA_APP_VERSION', 'v1.0.0'),
  instance: config.get<string>('GRAFANA_INSTANCE'),
});

export const GrafanaConfig = registerAs(grafanaConfigKey, () => {
  const config = new ConfigService();
  return grafanaConfigFactory(config);
});
