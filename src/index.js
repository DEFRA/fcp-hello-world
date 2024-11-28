import { createContainer } from './infra/container.js'
import Logger from './infra/logger.js'
import Config from './infra/config.js'

const run = async () => {
  const logger = new Logger({
    config: new Config()
  })

  try {
    const container = await createContainer()

    for (const signal of ['SIGINT', 'SIGTERM', 'SIGUSR2']) {
      process.on(signal, async () => {
        try {
          await container.dispose()
        } catch (err) {
          logger.error(err)
          process.exitCode = 1
        }
      })
    }

    await container.resolve('temporalClient').start()
    await container.resolve('app').start()
    await container.resolve('temporalWorker').start()
  } catch (err) {
    logger.error(err)
    process.exitCode = 1
  }
}

run()
