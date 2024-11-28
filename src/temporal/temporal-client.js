import { Client, Connection } from '@temporalio/client'
import { Lifetime, RESOLVER } from 'awilix'
import processApplication, {
  approvedSignal,
  completeManualAssessment,
  getStatusQuery
} from './temporal-workflow.js'

export default class TemporalClient {
  constructor({ config }) {
    this.client = null
    this.config = config
  }

  async start() {
    this.client = new Client({
      namespace: this.config.temporal.namespace,
      connection: await Connection.connect({
        address: this.config.temporal.url,
        tls:
          this.config.temporal.mtls.crt && this.config.temporal.mtls.key
            ? {
                clientCertPair: {
                  crt: Buffer.from(this.config.temporal.mtls.crt, 'base64'),
                  key: Buffer.from(this.config.temporal.mtls.key, 'base64')
                }
              }
            : null
      })
    })
  }

  async runWorkflow(caseId, applicationId) {
    const result = await this.client.workflow.start(processApplication, {
      taskQueue: 'FTF_GRANT_APPLICATIONS',
      workflowId: `case-${caseId}`,
      args: [caseId, applicationId]
    })

    return result.workflowId
  }

  async dispose() {
    await this.client.connection.close()
  }

  async describe(workflowId) {
    return this.client.workflow.getHandle(workflowId).describe()
  }

  async getStatus(workflowId) {
    return this.client.workflow.getHandle(workflowId).query(getStatusQuery)
  }

  async signalApproved(workflowId) {
    return this.client.workflow.getHandle(workflowId).signal(approvedSignal)
  }

  async completeManualAssessment(workflowId) {
    return this.client.workflow
      .getHandle(workflowId)
      .signal(completeManualAssessment)
  }
}

TemporalClient[RESOLVER] = {
  lifetime: Lifetime.SINGLETON,
  dispose: (client) => client.dispose()
}
