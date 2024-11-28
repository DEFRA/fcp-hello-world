import { ApplicationApproved } from '../kernel/events/application-approved.js'
import { ApplicationInProgress } from '../kernel/events/application-in-progress.js'
import { ApplicationInformationRequested } from '../kernel/events/application-information-requested.js'
import { ApplicationRejected } from '../kernel/events/application-rejected.js'
import { ApplicationWithdrawn } from '../kernel/events/application-withdrawn.js'
import { ApplicationStatus } from '../models/application-status.js'

export default class ApplicationSubscriber {
  constructor({ events, applicationService }) {
    this.events = events
    this.applicationService = applicationService
  }

  subscribe() {
    this.events.subscribe(
      ApplicationInProgress,
      this.onApplicationInProgress.bind(this)
    )

    this.events.subscribe(
      ApplicationApproved,
      this.onApplicationApproved.bind(this)
    )

    this.events.subscribe(
      ApplicationRejected,
      this.onApplicationRejected.bind(this)
    )

    this.events.subscribe(
      ApplicationWithdrawn,
      this.onApplicationWithdrawn.bind(this)
    )

    this.events.subscribe(
      ApplicationInformationRequested,
      this.onApplicationInformationRequested.bind(this)
    )
  }

  async onApplicationInProgress(event) {
    const { applicationId } = event.data

    await this.applicationService.updateStatus(
      applicationId,
      ApplicationStatus.InProgress
    )
  }

  async onApplicationApproved(event) {
    const { entityId } = event.data

    await this.applicationService.updateStatus(
      entityId,
      ApplicationStatus.Approved
    )
  }

  async onApplicationWithdrawn(event) {
    const { entityId } = event.data

    await this.applicationService.updateStatus(
      entityId,
      ApplicationStatus.Withdrawn
    )
  }

  async onApplicationRejected(event) {
    const { entityId } = event.data

    await this.applicationService.updateStatus(
      entityId,
      ApplicationStatus.Rejected
    )
  }

  async onApplicationInformationRequested(event) {
    const { entityId, data } = event.data

    await this.applicationService.requestInformation(entityId, data.message)
  }
}
