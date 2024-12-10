import { ApplicationApproved } from '../kernel/events/application-approved.js'
import { CaseCreated } from '../kernel/events/case-created.js'
import { ApplicationStatus } from '../models/application-status.js'
import { createActivities } from '../temporal/temporal-activities.js'

export default class WorkflowSubscriber {
  constructor({
    events,
    config,
    logger,
    caseService,
    userService,
    applicationService,
    companiesHouseService
  }) {
    this.events = events
    this.activities = createActivities(
      config,
      logger,
      caseService,
      userService,
      applicationService,
      companiesHouseService
    )
  }

  subscribe() {
    this.events.subscribe(CaseCreated, this.onCaseCreated.bind(this))

    this.events.subscribe(
      ApplicationApproved,
      this.onApplicationApproved.bind(this)
    )
  }

  async onCaseCreated(event) {
    const caseId = event.data.entityId
    const { applicationId } = event.data.data

    await this.activities.assignToCaseWorker(caseId)
    await this.activities.isFraudRisk(caseId, applicationId)
    await this.activities.runCompaniesHouseChecks(caseId, applicationId)
  }

  async onApplicationApproved(event) {
    await this.activities.notifyApplicant(
      event.data.entityId,
      ApplicationStatus.Approved
    )
  }
}
