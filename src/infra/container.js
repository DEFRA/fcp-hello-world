import path from 'node:path'
import { asClass, createContainer as createAwilixContainer } from 'awilix'

export const createContainer = async () => {
  const container = createAwilixContainer()

  const root = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '..'
  )

  await container.loadModules(
    [
      `${root}/controllers/**/*.js`,
      `${root}/infra/**/*.js`,
      `${root}/services/**/*.js`,
      `${root}/repositories/**/*.js`,
      `${root}/subscribers/**/*.js`,
      `${root}/temporal/**/*.js`
    ],
    {
      resolverOptions: {
        register: asClass
      },
      formatName: 'camelCase',
      esModules: true
    }
  )

  return container
}
