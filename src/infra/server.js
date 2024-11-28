import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import hapi from '@hapi/hapi'
import hapiVision from '@hapi/vision'
import inert from '@hapi/inert'
import hapiPulse from 'hapi-pulse'
import hapiPino from 'hapi-pino'
import nunjucks from 'nunjucks'
import { Lifetime, RESOLVER } from 'awilix'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default class Server {
  server

  constructor({
    config,
    logger,
    grantController,
    applicationController,
    userController,
    caseController,
    govformsController,
    dashboardController,
    healthController,
    fileController
  }) {
    const root = path.resolve(dirname, '../..')

    this.logger = logger
    this.config = {
      env: config.env,
      server: {
        port: config.server.port,
        host: config.server.host,
        router: {
          stripTrailingSlash: true
        },
        routes: {
          files: {
            relativeTo: `${root}/.public`
          },
          security: {
            hsts: {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: false
            },
            xss: 'enabled',
            noSniff: true,
            xframe: true
          }
        }
      },
      plugins: {
        logger: {
          plugin: hapiPino,
          options: {
            ignorePaths: ['/health'],
            instance: logger.pino
          }
        },
        pulse: {
          plugin: hapiPulse,
          options: {
            logger,
            timeout: 10_000
          }
        },
        vision: {
          plugin: hapiVision,
          options: {
            engines: {
              njk: {
                compile: (src, options) => {
                  const template = nunjucks.compile(src, options.environment)
                  return (context) => template.render(context)
                }
              }
            },
            compileOptions: {
              environment: nunjucks.configure(
                [
                  'node_modules/govuk-frontend/dist/',
                  path.resolve(dirname, '../server/common/templates'),
                  path.resolve(dirname, '../server/common/components'),
                  path.resolve(dirname, '../views')
                ],
                {
                  autoescape: true,
                  throwOnUndefined: false,
                  trimBlocks: true,
                  lstripBlocks: true,
                  watch: config.env === 'development',
                  noCache: config.env === 'development'
                }
              )
            },
            relativeTo: path.resolve(dirname, '..'),
            path: 'views',
            isCached: config.env === 'production',
            context: async (request) => {
              const content = await readFile(
                `${root}/.public/assets-manifest.json`,
                'utf-8'
              )
              const webpackManifest = JSON.parse(content)

              return {
                assetPath: '/public/assets',
                serviceName: 'Grant Application Management',
                serviceUrl: '/',
                breadcrumbs: [],
                navigation: [
                  {
                    text: 'Dashboard',
                    url: '/',
                    active: request.path === '/'
                  },
                  {
                    text: 'Cases',
                    url: '/cases',
                    active: request.path?.startsWith('/cases')
                  },
                  {
                    text: 'Grants',
                    url: '/grants',
                    active: request.path?.startsWith('/grants')
                  },
                  {
                    text: 'Users',
                    url: '/users',
                    active: request.path?.startsWith('/users')
                  }
                ],
                getAssetPath(asset) {
                  const webpackAssetPath = webpackManifest[asset]

                  return `/public/${webpackAssetPath}`
                }
              }
            }
          }
        }
      }
    }

    this.routes = [
      ...grantController.routes,
      ...applicationController.routes,
      ...userController.routes,
      ...caseController.routes,
      ...govformsController.routes,
      ...dashboardController.routes,
      ...healthController.routes,
      ...fileController.routes
    ]
  }

  #onPreResponse(request, h) {
    const { response } = request

    if (!response.isBoom) {
      return h.continue
    }

    request.logger.error(response.stack)

    const statusCode = response.output.statusCode

    const message =
      {
        404: 'Page not found',
        403: 'Forbidden',
        401: 'Unauthorized',
        400: 'Bad Request'
      }[statusCode] || 'Something went wrong'

    return h
      .view('error/index', {
        pageTitle: message,
        heading: statusCode,
        message
      })
      .code(statusCode)
  }

  async start() {
    this.server = hapi.server(this.config.server)

    if (this.config.env !== 'test') {
      await this.server.register(this.config.plugins.logger)
    }

    await this.server.register([
      this.config.plugins.pulse,
      this.config.plugins.vision,
      inert
    ])

    this.server.route(this.routes)

    this.server.ext('onPreResponse', this.#onPreResponse)

    try {
      await this.server.start()

      this.logger.info(
        `Server started on http://localhost:${this.config.server.port}`
      )
    } catch (err) {
      this.logger.error('Failed to start server', { error: err })
      throw err
    }
  }

  async dispose() {
    await this.server?.stop()
  }
}

Server[RESOLVER] = {
  lifetime: Lifetime.SINGLETON,
  dispose: (instance) => instance.dispose()
}
