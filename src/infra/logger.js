import pino, { stdSerializers } from 'pino'
import ecsFormat from '@elastic/ecs-pino-format'

export default class Logger {
  constructor({ config }) {
    const options = {
      development: {
        level: config.logLevel,
        stdSerializers,
        transport: { target: 'pino-pretty' }
      },
      production: {
        level: config.logLevel,
        stdSerializers,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers'
          ],
          remove: true
        },
        ...ecsFormat(),
        base: {
          service: {
            name: config.serviceName,
            type: 'nodeJs',
            version: config.serviceVersion
          }
        }
      },
      test: {
        enabled: false
      }
    }[config.env]

    this.pino = pino(options)
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
