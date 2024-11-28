import { differenceInMilliseconds } from 'date-fns'
import { ApplicationApproved } from '../kernel/events/application-approved.js'
import { CaseStatusChanged } from '../kernel/events/case-status-changed.js'
import { Status } from '../models/status.js'

export default class DashboardService {
  constructor({ eventService, grantService, applicationService }) {
    this.eventService = eventService
    this.grantService = grantService
    this.applicationService = applicationService
  }

  async getDashboardData(range) {
    const [caseStatusChangedEvents, applicationApprovedEvents, activeGrants] =
      await Promise.all([
        this.eventService.findByName(CaseStatusChanged.name, range),
        this.eventService.findByName(ApplicationApproved.name, range),
        this.grantService.findActive(range)
      ])

    const eventsPerCase = Object.values(
      caseStatusChangedEvents.reduce((acc, curr) => {
        acc[curr.entityId] ??= []
        acc[curr.entityId].push(curr)
        return acc
      }, {})
    )

    const countByStatus = {
      [Status.Open]: 0,
      [Status.InProgress]: 0,
      [Status.Pending]: 0,
      [Status.Resolved]: 0
    }

    for (const events of eventsPerCase) {
      const lastEvent = events[events.length - 1]
      countByStatus[lastEvent.data.newStatus]++
    }

    const toPay = await this.applicationService.getValueOfApplications(
      applicationApprovedEvents.map((e) => e.entityId)
    )

    return {
      cases: {
        countByStatus,
        avgTimeToResolveInMs: this.#getAvgTimeToResolveInMs(eventsPerCase)
      },
      grants: {
        active: activeGrants.length,
        totalPotValue: activeGrants.reduce((acc, curr) => acc + curr.pot, 0),
        toPay
      }
    }
  }

  #getAvgTimeToResolveInMs(eventsPerCase) {
    let totalInMs = 0
    let occurances = 0

    for (const events of eventsPerCase) {
      const firstOpenedEvent = events.find(
        (e) => e.data.newStatus === Status.Open
      )

      const lastResolvedEvent = events.findLast(
        (e) => e.data.newStatus === Status.Resolved
      )

      if (!firstOpenedEvent || !lastResolvedEvent) {
        continue
      }

      totalInMs += differenceInMilliseconds(
        lastResolvedEvent.publishedAt,
        firstOpenedEvent.publishedAt
      )

      occurances += 1
    }

    const avgTimeToResolveInMs =
      occurances === 0 ? 0 : Math.ceil(totalInMs / occurances)

    return avgTimeToResolveInMs
  }
}
