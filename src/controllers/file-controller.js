export default class FileController {
  staticCacheTimeoutMs = 7 * 24 * 60 * 60 * 1000

  routes = [
    {
      method: 'GET',
      path: '/favicon.ico',
      options: {
        auth: false,
        cache: {
          expiresIn: this.staticCacheTimeoutMs,
          privacy: 'private'
        }
      },
      handler: this.getFavIcon.bind(this)
    },
    {
      method: 'GET',
      path: `/public/{param*}`,
      options: {
        auth: false,
        cache: {
          expiresIn: this.staticCacheTimeoutMs,
          privacy: 'private'
        }
      },
      handler: {
        directory: {
          path: '.',
          redirectToSlash: true
        }
      }
    }
  ]

  getFavIcon(_, h) {
    return h.response().code(204).type('image/x-icon')
  }
}
