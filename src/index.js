import { createContainer } from './infra/container.js'
import Logger from './infra/logger.js'
import Config from './infra/config.js'

const run = async () => {
  const logger = new Logger({
    config: new Config()
  })

  try {
    const container = await createContainer()

    ;['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((signal) =>
      process.on(signal, container.dispose)
    )

    await container.resolve('app').start()
  } catch (err) {
    logger.error(err)
    process.exitCode = 1
  }
}

run()
