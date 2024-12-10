import { ApplicationApproved } from '../kernel/events/application-approved.js'
import { CaseCreated } from '../kernel/events/case-created.js'

export default class TemporalSubscriber {
  constructor({ events, temporalClient, temporalWorker }) {
    this.events = events
    this.temporalClient = temporalClient
    this.temporalWorker = temporalWorker
  }

  async subscribe() {
    await this.temporalClient.start()
    this.temporalWorker.start()

    this.events.subscribe(CaseCreated, this.onCaseCreated.bind(this))

    this.events.subscribe(
      ApplicationApproved,
      this.onApplicationApproved.bind(this)
    )
  }

  async onCaseCreated(event) {
    const { entityId } = event.data
    const { applicationId } = event.data.data

    await this.temporalClient.runWorkflow(entityId, applicationId)
  }

  async onApplicationApproved(event) {
    await this.temporalClient.signalApproved(`case-${event.data.data.caseId}`)
  }
}
