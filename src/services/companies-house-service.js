import { ProxyAgent } from 'undici'

export default class CompaniesHouseService {
  constructor({ config }) {
    this.url = config.companiesHouse.apiUrl
    this.key = Buffer.from(config.companiesHouse.apiKey).toString('base64')
    this.proxyAgent = config.proxy.https
      ? new ProxyAgent({
          uri: config.proxy.https,
          keepAliveTimeout: 10,
          keepAliveMaxTimeout: 10
        })
      : null
  }

  async getCompanyProfile(companyNumber) {
    const url = `${this.url}/company/${companyNumber}`

    const response = await fetch(url, {
      dispatcher: this.proxyAgent,
      headers: {
        Authorization: `Basic ${this.key}`
      }
    })

    if (!response.ok) {
      throw new Error(
        `Failed to get company profile. Status: ${response.status}`
      )
    }

    const profile = await response.json().catch((err) => {
      throw new Error(`Failed to parse response: ${err.message}`)
    })

    return {
      name: profile.company_name,
      number: profile.company_number,
      status: profile.company_status,
      dateOfCreation: profile.date_of_creation,
      dateOfCessation: profile.date_of_cessation,
      hasCharges: profile.has_charges,
      hasBeenLiquidated: profile.has_been_liquidated,
      hasInsolvencyHistory: profile.has_insolvency_history
    }
  }
}
