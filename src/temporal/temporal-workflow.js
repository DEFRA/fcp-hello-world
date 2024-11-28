import {
  ApplicationFailure,
  condition,
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler
} from '@temporalio/workflow'

import { ApplicationStatus } from '../models/application-status.js'

export const approvedSignal = defineSignal('approved')
export const rejectedSignal = defineSignal('rejected')
export const completeManualAssessment = defineSignal('completeManualAssessment')
export const getStatusQuery = defineQuery('getStatus')

const {
  assignToCaseWorker,
  isFraudRisk,
  runCompaniesHouseChecks,
  notifyApplicant
} = proxyActivities({
  startToCloseTimeout: '1 minute'
})

export default async function processApplication(caseId, applicationId) {
  const stages = {
    S1: 'Pending'
  }

  let status = ApplicationStatus.Submitted

  setHandler(rejectedSignal, () => {
    status = ApplicationStatus.Rejected
  })

  setHandler(approvedSignal, () => {
    status = ApplicationStatus.Approved
  })

  setHandler(getStatusQuery, () => ({ stages, applicationId }))

  try {
    await assignToCaseWorker(caseId)
  } catch (err) {
    const message = `Failed to assign case worker. Error: ${err.message}`
    throw ApplicationFailure.create({ message })
  }

  try {
    stages.S1 = 'In Progress'
    await isFraudRisk(caseId, applicationId)
  } catch (err) {
    const message = `Failed to check if applicant is a fraud risk. Error: ${err.message}`
    throw ApplicationFailure.create({ message })
  }

  stages.S1 = 'Completed'

  try {
    await runCompaniesHouseChecks(caseId, applicationId)
  } catch (err) {
    const message = `Failed to run Companies House checks. Error: ${err.message}`
    throw ApplicationFailure.create({ message })
  }

  const applicationApproved = await condition(
    () =>
      status === ApplicationStatus.Approved ||
      status === ApplicationStatus.Rejected,
    '10 min'
  )

  if (applicationApproved) {
    await notifyApplicant(applicationId, status)
  }
}
