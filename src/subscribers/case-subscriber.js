import { ApplicationInformationReceived } from '../kernel/events/application-information-received.js'
import { ApplicationSubmitted } from '../kernel/events/application-submitted.js'

export default class CaseSubscriber {
  constructor({ events, caseService }) {
    this.events = events
    this.caseService = caseService
  }

  subscribe() {
    this.events.subscribe(
      ApplicationSubmitted,
      this.onApplicationSubmitted.bind(this)
    )

    this.events.subscribe(
      ApplicationInformationReceived,
      this.onApplicationInformationReceived.bind(this)
    )
  }

  async onApplicationSubmitted(event) {
    await this.caseService.save(event.data.entityId, event.data.data.grantId)
  }

  async onApplicationInformationReceived(event) {
    await this.caseService.receiveInformation(event.data.applicationId)
  }
}
