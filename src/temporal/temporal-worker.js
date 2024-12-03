import { setTimeout } from 'node:timers/promises'
import { URL, fileURLToPath } from 'node:url'
import { NativeConnection, Worker } from '@temporalio/worker'
import { Lifetime, RESOLVER } from 'awilix'
import { createActivities } from './temporal-activities.js'

export default class TemporalWorker {
  constructor({
    config,
    logger,
    caseService,
    userService,
    applicationService,
    companiesHouseService
  }) {
    this.config = config
    this.logger = logger
    this.caseService = caseService
    this.userService = userService
    this.applicationService = applicationService
    this.companiesHouseService = companiesHouseService
  }

  async start() {
    const workflowsPathUrl = new URL('./temporal-workflow.js', import.meta.url)

    process.env.grpc_proxy = this.config.proxy.http

    this.worker = await Worker.create({
      taskQueue: 'FTF_GRANT_APPLICATIONS',
      workflowsPath: fileURLToPath(workflowsPathUrl),
      activities: createActivities(
        this.config,
        this.logger,
        this.caseService,
        this.userService,
        this.applicationService,
        this.companiesHouseService
      ),
      namespace: this.config.temporal.namespace,
      connection: await NativeConnection.connect({
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

    await this.worker.run()
  }

  async dispose() {
    while (this.worker.getState() !== 'STOPPED') {
      await setTimeout(500)
    }

    await this.worker.connection.close()
  }
}

TemporalWorker[RESOLVER] = {
  lifetime: Lifetime.SINGLETON,
  dispose: (worker) => worker.dispose()
}
