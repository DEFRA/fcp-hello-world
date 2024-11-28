import { env } from 'node:process'

export default class Config {
  env = env.NODE_ENV

  logLevel = env.LOG_LEVEL

  assetPath = '/public'

  server = {
    port: 3000,
    host: '0.0.0.0'
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