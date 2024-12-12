import { URL, fileURLToPath } from 'node:url'
import {
  NativeConnection,
  Worker,
  DefaultLogger,
  Runtime,
  makeTelemetryFilterString
} from '@temporalio/worker'
import { Lifetime, RESOLVER } from 'awilix'
import { createActivities } from './temporal-activities.js'

export default class TemporalWorker {
  worker = null

  constructor({
    config,
    logger,
    caseService,
    userService,
    notifyService,
    applicationService,
    companiesHouseService
  }) {
    this.config = config
    this.logger = logger
    this.caseService = caseService
    this.userService = userService
    this.notifyService = notifyService
    this.applicationService = applicationService
    this.companiesHouseService = companiesHouseService
  }

  async start() {
    Runtime.install({
      // Install a logger to collect logs generated by Node.js Workers and Rust Core.
      // Note: In production, WARN should generally be enough. DEBUG is quite verbose.
      logger: new DefaultLogger('DEBUG', (entry) => {
        const level = entry.level.toLowerCase()
        this.logger[level](
          {
            label: entry.meta?.activityId
              ? 'activity'
              : entry.meta?.workflowId
                ? 'workflow'
                : 'worker',
            timestamp: Number(entry.timestampNanos / 1_000_000n),
            ...entry.meta
          },
          entry.message
        )
      }),
      // Telemetry options control how logs are exported out of Rust Core.
      telemetryOptions: {
        logging: {
          // By default, Core logs go directly to console. Setting the `forward` property here (to an
          // empty object) enables forwarding of logs from Rust Core to the Node.js logger.
          forward: {},
          // This filter determines which logs should be forwarded from Rust Core to the Node.js logger.
          // Note: In production, WARN should generally be enough. DEBUG is quite verbose.
          filter: makeTelemetryFilterString({ core: 'DEBUG' })
        }
      }
    })

    const workflowsPathUrl = new URL('./temporal-workflow.js', import.meta.url)
    // process.env.grpc_proxy = this.config.proxy.https

    // const workflowBundle =
    //   this.config.env === 'production'
    //     ? {
    //         workflowBundle: {
    //           codePath: fileURLToPath(
    //             new URL('../temporal-workflow-bundle.js', import.meta.url)
    //           )
    //         }
    //       }
    //     : {
    //         workflowsPath: fileURLToPath(
    //           new URL('./temporal-workflow.js', import.meta.url)
    //         )
    //       }

    // const workflowBundle = {
    //   workflowsPath: fileURLToPath(
    //     new URL('./temporal-workflow.js', import.meta.url)
    //   )
    // }

    // const [creds, targetHost] = this.config.proxy.https.split('@')
    // const [username, password] = creds.split(':')

    const connection = await NativeConnection.connect({
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
      connection
    })

    await this.worker.run()
    await connection.close()
  }

  async dispose() {
    // await this.worker?.shutdown()
    // while (this.worker.getState() !== 'STOPPED') {
    //   await setTimeout(500)
    // }
    // await this.worker.connection.close()
  }
}

TemporalWorker[RESOLVER] = {
  lifetime: Lifetime.SINGLETON,
  dispose: (worker) => worker.dispose()
}
