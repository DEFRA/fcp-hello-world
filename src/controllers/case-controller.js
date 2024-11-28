import qs from 'qs'
import { CaseAssigned } from '../kernel/events/case-assigned.js'
import { CaseStageCompleted } from '../kernel/events/case-stage-completed.js'
import { CaseStatusChanged } from '../kernel/events/case-status-changed.js'
import { ApplicationStatus } from '../models/application-status.js'

export default class CaseController {
  routes = [
    {
      method: 'GET',
      path: '/api/cases',
      handler: this.findAll.bind(this)
    },
    {
      method: 'GET',
      path: '/api/cases/{caseId}',
      handler: this.findById.bind(this)
    },
    {
      method: 'DELETE',
      path: '/api/cases/{caseId}',
      handler: this.delete.bind(this)
    },
    {
      method: 'POST',
      path: '/api/cases/{caseId}/assign/{userId}',
      handler: this.assign.bind(this)
    },
    {
      method: 'POST',
      path: '/api/cases/{caseId}/start',
      handler: this.startAssessment.bind(this)
    },
    {
      method: 'POST',
      path: '/api/cases/{caseId}/request-information',
      handler: this.requestInformation.bind(this)
    },
    {
      method: 'POST',
      path: '/api/cases/{caseId}/approve',
      handler: this.approve.bind(this)
    },
    {
      method: 'POST',
      path: '/api/cases/{caseId}/reject',
      handler: this.reject.bind(this)
    },
    {
      method: 'POST',
      path: '/api/cases/{caseId}/withdraw',
      handler: this.withdraw.bind(this)
    },
    {
      method: 'POST',
      path: '/api/cases/{caseId}/tasks/{taskId}/complete',
      handler: this.completeTask.bind(this)
    },

    {
      method: 'GET',
      path: '/cases',
      handler: this.listCasesPage.bind(this)
    },

    {
      method: 'GET',
      path: '/cases/{caseId}',
      handler: this.viewCasePage.bind(this)
    },

    {
      method: ['GET', 'POST'],
      path: '/cases/{caseId}/assign',
      handler: this.assignCasePage.bind(this)
    },

    {
      method: ['GET', 'POST'],
      path: '/cases/{caseId}/decide',
      handler: this.makeDecisionPage.bind(this)
    },

    {
      method: 'GET',
      path: '/cases/{caseId}/stages/{stageId}/tasks',
      handler: this.viewCaseTasksForStagePage.bind(this)
    },

    {
      method: 'POST',
      path: '/cases/{caseId}/stages/{stageId}/tasks',
      handler: this.updateCaseTasksForStage.bind(this),
      options: {
        payload: {
          output: 'data',
          parse: false
        }
      }
    }
  ]

  constructor({ caseService, userService, applicationService, eventService }) {
    this.caseService = caseService
    this.userService = userService
    this.applicationService = applicationService
    this.eventService = eventService
  }

  async findAll() {
    return this.caseService.findAll()
  }

  async findById(request, h) {
    const { caseId } = request.params

    const kase = await this.caseService.findById(caseId)

    if (!kase) {
      return h.response().code(404)
    }

    return kase
  }

  async delete(request, h) {
    const { caseId } = request.params

    const existingCase = await this.caseService.findById(caseId)

    if (!existingCase) {
      return h.response().code(404)
    }

    await this.caseService.delete(caseId)

    return h.response().code(204)
  }

  async assign(request, h) {
    const { caseId, userId } = request.params

    const kase = await this.caseService.assign(caseId, userId)

    return h.response(kase).code(202)
  }

  async startAssessment(request, h) {
    const { caseId, status } = request.params

    const kase = await this.caseService.startAssessment(caseId, status)

    return h.response(kase).code(202)
  }

  async requestInformation(request, h) {
    const { caseId } = request.params
    const message = request.payload

    const kase = await this.caseService.requestInformation(caseId, message)

    return h.response(kase).code(202)
  }

  async completeTask(request, h) {
    const { caseId, taskId } = request.params

    const kase = await this.caseService.completeTask(caseId, taskId)

    return h.response(kase).code(202)
  }

  async approve(request, h) {
    const { caseId } = request.params
    const result = await this.caseService.approveApplication(caseId)

    if (result.isFail()) {
      return h
        .response({
          message: result.error.message,
          tasks: result.error.tasks
        })
        .code(409)
    }

    return h.response(result.value).code(202)
  }

  async reject(request, h) {
    const { caseId } = request.params

    const kase = await this.caseService.rejectApplication(caseId)

    return h.response(kase).code(202)
  }

  async withdraw(request, h) {
    const { caseId } = request.params

    const kase = await this.caseService.withdrawApplication(caseId)

    return h.response(kase).code(202)
  }

  async listCasesPage(request, h) {
    const cases = await this.caseService.findAll()
    const casesWithUsers = await Promise.all(
      cases.map(async (kase) => {
        const user = await this.userService.findById(kase.userId)
        return {
          ...kase,
          user
        }
      })
    )

    return h.view('cases/index', {
      nav: { casesActive: true },
      cases: casesWithUsers
    })
  }

  async viewCasePage(request, h) {
    const { caseId } = request.params

    const kase = await this.caseService.findById(caseId)

    const [user, application, events] = await Promise.all([
      this.userService.findById(kase.userId),
      this.applicationService.findById(kase.applicationId),
      this.eventService.findAllByEntityId(caseId)
    ])

    const timelineUserIds = events
      .filter((event) => event.name === 'CaseAssigned')
      .flatMap((event) => [event.data.oldUserId, event.data.newUserId])

    const timelineUsers = await this.userService.findByIds([
      ...new Set(timelineUserIds)
    ])

    const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short'
    })

    const formatEvent = (event) => {
      if (event.name === CaseStatusChanged.name) {
        return event.data.oldStatus
          ? `${event.data.oldStatus} → ${event.data.newStatus}`
          : `New → ${event.data.newStatus}`
      }

      if (event.name === CaseAssigned.name) {
        const newUser = timelineUsers.find((u) => u.id === event.data.newUserId)

        if (event.data.oldUserId) {
          const oldUser = timelineUsers.find(
            (u) => u.id === event.data.oldUserId
          )
          return `${oldUser.firstName} ${oldUser.lastName} → ${newUser.firstName} ${newUser.lastName}`
        }

        return `Unassigned → ${newUser.firstName} ${newUser.lastName}`
      }

      if (event.name === CaseStageCompleted.name) {
        const task = kase.stages.find((t) => t.id === event.data.stageId)
        return task.name
      }

      return '-'
    }

    const timeline = events
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .map((event) => [
        {
          text: dateTimeFormat
            .format(new Date(event.publishedAt))
            .split(', ')
            .reverse()
            .join(' ')
        },
        {
          text: event.name
        },
        {
          text: formatEvent(event)
        }
      ])

    const applicationStages = {
      idPrefix: 'applicationStages',
      items: kase.stages.map((stage) => {
        const tag = stage.isComplete
          ? {
              text: 'Completed',
              classes: 'govuk-tag--green'
            }
          : stage.needsReview
            ? {
                text: 'Review',
                classes: 'govuk-tag--orange'
              }
            : stage.isPartiallyComplete
              ? {
                  text: 'In Progress',
                  classes: 'govuk-tag--light-blue'
                }
              : {
                  text: 'Incomplete',
                  classes: 'govuk-tag--blue'
                }

        return {
          title: {
            text: stage.name
          },
          href: `/cases/${kase.id}/stages/${stage.id}/tasks`,
          status: {
            tag
          }
        }
      })
    }

    const caseSummaryList = {
      rows: [
        {
          key: {
            text: 'Status'
          },
          value: {
            text: kase.status
          }
        },
        {
          key: {
            text: 'Assigned To'
          },
          value: {
            text: user ? `${user.firstName} ${user.lastName}` : 'Unassigned'
          },
          actions: {
            items:
              application.status === ApplicationStatus.Submitted
                ? [
                    {
                      href: `/cases/${caseId}/assign`,
                      text: user ? 'Change' : 'Assign'
                    }
                  ]
                : []
          }
        },
        {
          key: {
            text: 'Decision'
          },
          value: {
            text:
              application.status === ApplicationStatus.Submitted
                ? 'Pending'
                : application.status
          }
        }
      ]
    }

    const applicationSummaryList = {
      rows: application.answers.map((a) => {
        if (a.type === 'equipment') {
          return {
            key: {
              text: a.question
            },
            value: {
              html: `<ul class="govuk-list govuk-list--bullet">${a.answer
                .map((item) => `<li>${item.count} x ${item.code}</li>`)
                .join('')}</ul>`
            }
          }
        }

        if (a.type === 'files') {
          return {
            key: {
              text: a.question
            },
            value: {
              html: `<ul class="govuk-list govuk-list--bullet">${a.answer
                .map(
                  (item) => `
                  <li>
                    <a href="${item.downloadUrl}" class="govuk-link" download>
                      ${item.fileName}
                    </a>
                  </li>
                `
                )
                .join('')}</ul>`
            }
          }
        }

        return {
          key: {
            text: a.question
          },
          value: {
            text: Array.isArray(a.answer) ? a.answer.join(', ') : a.answer
          }
        }
      })
    }

    const stagesComplete = kase.stages.every((s) => s.isComplete)

    const makeDecisionBtn =
      application.status === ApplicationStatus.Submitted && stagesComplete
        ? {
            text: 'Make decision',
            href: `/cases/${caseId}/decide`,
            classes: 'govuk-!-margin-0'
          }
        : {
            text: 'Make decision',
            disabled: true,
            classes: 'govuk-!-margin-0'
          }

    return h.view('cases/case', {
      nav: { casesActive: true },
      kase,
      application,
      caseSummaryList,
      applicationStages,
      applicationSummaryList,
      makeDecisionBtn,
      timeline
    })
  }

  async assignCasePage(request, h) {
    const { caseId } = request.params

    const kase = await this.caseService.findById(caseId)

    if (!kase) {
      return h.response().code(404)
    }

    if (request.method === 'post') {
      const { caseId } = request.params
      const { userId } = request.payload

      await this.caseService.assign(caseId, userId)

      return h.redirect(`/cases/${caseId}`)
    }

    const users = await this.userService.findAll()

    const items = users.map((user) => ({
      value: user.id,
      text: `${user.firstName} ${user.lastName}`
    }))

    return h.view('cases/assign', {
      nav: { casesActive: true },
      kase,
      items
    })
  }

  async viewCaseTasksForStagePage(request, h) {
    const { caseId, stageId } = request.params

    const kase = await this.caseService.findById(caseId)

    const stage = kase.stages.find((s) => s.id === stageId)

    return h.view('cases/tasks', {
      nav: { casesActive: true },
      kase,
      stage
    })
  }

  async updateCaseTasksForStage(request, h) {
    const { caseId, stageId } = request.params

    const payload = qs.parse(request.payload.toString(), {
      arrayLimit: 50
    })

    await this.caseService.completeTasks(caseId, stageId, payload.tasks)

    return h.redirect(`/cases/${caseId}`)
  }

  async makeDecisionPage(request, h) {
    const { caseId } = request.params

    const kase = await this.caseService.findById(caseId)

    if (!kase) {
      return h.response().code(404)
    }

    if (request.method === 'post') {
      const { status } = request.payload

      if (status === ApplicationStatus.Approved) {
        await this.caseService.approveApplication(caseId)
      } else if (status === ApplicationStatus.Rejected) {
        await this.caseService.rejectApplication(caseId)
      } else if (status === ApplicationStatus.Withdrawn) {
        await this.caseService.withdrawApplication(caseId)
      }

      return h.redirect(`/cases/${caseId}`)
    }

    const application = await this.applicationService.findById(
      kase.applicationId
    )

    const decisionRadios = {
      name: 'status',
      fieldset: {
        legend: {
          text: 'Decision',
          isPageHeading: false,
          classes: 'govuk-fieldset__legend--m'
        }
      },
      items: [
        {
          value: ApplicationStatus.Approved,
          text: 'Approve',
          checked: application.status === ApplicationStatus.Approved
        },
        {
          value: ApplicationStatus.Rejected,
          text: 'Reject',
          checked: application.status === ApplicationStatus.Rejected
        },
        {
          value: ApplicationStatus.Withdrawn,
          text: 'Withdraw',
          checked: application.status === ApplicationStatus.Withdrawn
        }
      ]
    }

    return h.view('cases/decide', {
      nav: { casesActive: true },
      kase,
      decisionRadios,
      application
    })
  }
}
