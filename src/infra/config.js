import { env } from 'node:process'

export default class Config {
  env = env.NODE_ENV

  log = {
    enabled: env.LOG_ENABLED ?? true,
    level: env.LOG_LEVEL ?? 'warn',
    format: env.LOG_FORMAT ?? 'ecs'
  }

  assetPath = '/public'

  service = {
    name: 'fcp-hello-world',
    version: env.SERVICE_VERSION ?? '0.0.0'
  }

  server = {
    port: env.PORT ?? 3000,
    host: '0.0.0.0'
  }

  proxy = {
    https: env.CDP_HTTPS_PROXY
  }

  temporal = {
    url: env.TEMPORAL_SERVER_URL,
    namespace: env.TEMPORAL_NAMESPACE,
    mtls: {
      crt: env.TEMPORAL_MTLS_CRT,
      key: env.TEMPORAL_MTLS_KEY
    }
  }

  notify = {
    apiKey: env.GOVUK_NOTIFY_API_KEY,
    template: {
      decision: env.GOVUK_NOTIFY_DECISION_EMAIL_TEMPLATE_ID
    }
  }

  companiesHouse = {
    apiKey: env.COMPANIES_HOUSE_API_KEY,
    apiUrl: env.COMPANIES_HOUSE_API_URL
  }
}
