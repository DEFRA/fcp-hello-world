import { asClass, createContainer as createAwilixContainer } from 'awilix'

export const createContainer = async () => {
  const container = createAwilixContainer()

  await container.loadModules(
    [
      'src/controllers/**/*.js',
      'src/infra/**/*.js',
      'src/services/**/*.js',
      'src/repositories/**/*.js',
      'src/subscribers/**/*.js',
      'src/temporal/**/*.js'
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
