import { format } from 'date-fns'
import { Task } from '../models/case.js'
import { Role } from '../models/role.js'
import { Status } from '../models/status.js'

export const createActivities = (
  config,
  logger,
  caseService,
  userService,
  notifyService,
  applicationService,
  companiesHouseService
) => ({
  async assignToCaseWorker(caseId) {
    const [caseWorkers, openCases] = await Promise.all([
      userService.findByRole(Role.CaseWorker),
      caseService.findByStatus(Status.Open)
    ])

    const casesPerWorker = openCases.reduce((acc, kase) => {
      acc[kase.userId] ??= 0
      acc[kase.userId]++

      return acc
    }, {})

    const workerWithLeastCases = caseWorkers.reduce((acc, worker) => {
      if (!acc) {
        return worker
      }

      if ((casesPerWorker[worker.id] || 0) < (casesPerWorker[acc.id] || 0)) {
        return worker
      }

      return acc
    }, null)

    logger.info('Assigning case to least busy worker', {
      caseId,
      workerId: workerWithLeastCases.id
    })
    await caseService.assign(caseId, workerWithLeastCases.id)
  },
  async isFraudRisk(caseId, applicationId) {
    logger.info('Checking if applicant is a fraud risk', {
      caseId,
      applicationId
    })

    await caseService.completeTasks(caseId, 'S1', [
      {
        id: 'T1',
        isComplete: true,
        comment: 'Completed by temporal'
      }
    ])

    const application = await applicationService.findById(applicationId)

    if (application.meta.value > 25000) {
      const task = new Task()

      task.id = 'T5'
      task.description = 'Confirm applicant provided supporting evidence'
      task.isRequired = true
      task.isComplete = false

      await caseService.addTask(caseId, 'S3', task)
    }

    return false
  },
  async runCompaniesHouseChecks(caseId, applicationId) {
    const application = await applicationService.findById(applicationId)

    const businessName = application.answers.find(
      (a) => a.id === 'businessName'
    ).answer

    const companiesHouseNumber = application.answers.find(
      (a) => a.id === 'companiesHouseNumber'
    ).answer

    logger.info('Checking Companies House', {
      applicationId,
      businessName,
      companiesHouseNumber
    })

    const companyProfile =
      await companiesHouseService.getCompanyProfile(companiesHouseNumber)

    const businessNameMatchesCompanyNumber =
      companyProfile.name.toLowerCase() === businessName.toLowerCase()

    const now = new Date()

    const incorporated3YearsAgo =
      new Date(companyProfile.dateOfCreation).getFullYear() <
      now.getFullYear() - 3

    await caseService.completeTasks(caseId, 'S7', [
      {
        id: 'T50',
        isComplete: businessNameMatchesCompanyNumber,
        needsReview: !businessNameMatchesCompanyNumber,
        comment: null,
        hint: businessNameMatchesCompanyNumber
          ? `Business name matches "${companyProfile.name}" (company number ${companiesHouseNumber})`
          : `Business name "${businessName}" does not match company number ${companiesHouseNumber} ("${companyProfile.name}"). Please check  <a href="https://find-and-update.company-information.service.gov.uk/company/${companiesHouseNumber}" target="_blank" class="govuk-link">Companies House</a>`
      },
      {
        id: 'T51',
        isComplete: incorporated3YearsAgo,
        needsReview: !incorporated3YearsAgo,
        comment: null,
        hint: `"${companyProfile.name}" was incorporated on ${format(
          companyProfile.dateOfCreation,
          'dd/MM/yyyy'
        )}`
      },
      {
        id: 'T52',
        isComplete: !companyProfile.hasInsolvencyHistory,
        needsReview: companyProfile.hasInsolvencyHistory,
        comment: null,
        hint: companyProfile.hasInsolvencyHistory
          ? `"${companyProfile.name}" has insolvency history. Please check <a href="https://find-and-update.company-information.service.gov.uk/company/${companiesHouseNumber}/insolvency" target="_blank" class="govuk-link">Companies House</a>`
          : ''
      },
      {
        id: 'T53',
        isComplete: companyProfile.status === 'active',
        needsReview: companyProfile.status !== 'active',
        comment: null,
        hint:
          companyProfile.status !== 'active'
            ? `"${companyProfile.name}" is ${
                {
                  dissolved: 'dissolved',
                  administration: 'in administration'
                }[companyProfile.status]
              }. Please check <a href="https://find-and-update.company-information.service.gov.uk/company/${companiesHouseNumber}/insolvency" target="_blank" class="govuk-link">Companies House</a>`
            : ''
      }
    ])
  },
  async notifyApplicant(applicationId, status) {
    logger.info('Sending decision email', applicationId, status)

    if (config.env === 'production') {
      const application = await applicationService.findById(applicationId)

      await notifyService.sendEmail({
        templateId: config.notify.template.decision,
        email: application.meta.email,
        personalisation: {
          status: status.toLowerCase(),
          applicationId
        }
      })
    }
  }
})
