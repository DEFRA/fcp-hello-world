import { token } from '@hapi/jwt'
import { ProxyAgent } from 'undici'

export default class NotifyService {
  constructor({ config }) {
    this.url = 'https://api.notifications.service.gov.uk'

    const { apiKey } = config.notify
    this.apiKeyId = apiKey.substring(apiKey.length - 36, apiKey.length)
    this.serviceId = apiKey.substring(apiKey.length - 73, apiKey.length - 37)

    this.proxyAgent = config.proxy.https
      ? new ProxyAgent({
          uri: config.proxy.https,
          keepAliveTimeout: 10,
          keepAliveMaxTimeout: 10
        })
      : null
  }

  #createToken() {
    return token.generate(
      {
        iss: this.serviceId,
        iat: Math.round(Date.now() / 1000)
      },
      this.apiKeyId,
      {
        header: {
          typ: 'JWT',
          alg: 'HS256'
        }
      }
    )
  }

  async sendEmail({ templateId, email, personalisation }) {
    const url = `${this.url}/v2/notifications/email`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.#createToken()}`
      },
      body: JSON.stringify({
        template_id: templateId,
        email_address: email,
        personalisation
      }),
      dispatcher: this.proxyAgent
    })

    if (!response.ok) {
      throw new Error(
        `Failed to call Gov.UK Notify. Status: ${response.status}`
      )
    }
  }
}
