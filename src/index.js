import { createContainer } from './infra/container.js'

const run = async () => {
  const container = await createContainer()
  const logger = container.resolve('logger')

  const dispose = async () => {
    try {
      await container.dispose()
    } catch (err) {
      logger.error(err)
      process.exitCode = 1
    }
  }

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGUSR2']) {
    process.on(signal, dispose)
  }

  try {
    await container.resolve('temporalClient').start()
    await container.resolve('app').start()
    await container.resolve('temporalWorker').start()
  } catch (err) {
    logger.error(err)
    process.exitCode = 1
  }
}

run()
