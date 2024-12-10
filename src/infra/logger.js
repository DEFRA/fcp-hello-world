import pino, { stdSerializers } from 'pino'
import ecsFormat from '@elastic/ecs-pino-format'

export default class Logger {
  constructor({ config }) {
    const format = {
      pretty: {
        transport: { target: 'pino-pretty' }
      },
      ecs: {
        ...ecsFormat()
      }
    }

    this.pino = pino({
      enabled: config.log.enabled,
      level: config.log.level,
      stdSerializers,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers'
        ],
        remove: true
      },
      base: {
        service: {
          name: config.service.name,
          type: 'nodeJs',
          version: config.service.version
        }
      },
      ...format[config.log.format]
    })
  }

  debug(...args) {
    this.pino.debug(...args)
  }

  info(...args) {
    this.pino.info(...args)
  }

  warn(...args) {
    this.pino.warn(...args)
  }

  error(...args) {
    this.pino.error(...args)
  }
}
