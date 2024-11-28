export default class ApplicationController {
  routes = [
    {
      method: 'POST',
      path: '/api/applications',
      handler: this.create.bind(this)
    },
    {
      method: 'GET',
      path: '/api/applications',
      handler: this.findAll.bind(this)
    },
    {
      method: 'GET',
      path: '/api/applications/{applicationId}',
      handler: this.findById.bind(this)
    },
    {
      method: 'PUT',
      path: '/api/applications/{applicationId}',
      handler: this.update.bind(this)
    },
    {
      method: 'POST',
      path: '/api/applications/{applicationId}/messages',
      handler: this.postMessage.bind(this)
    },
    {
      method: 'DELETE',
      path: '/api/applications/{applicationId}',
      handler: this.delete.bind(this)
    }
  ]

  constructor({ applicationService }) {
    this.applicationService = applicationService
  }

  async create(request, h) {
    const { grantId, answers } = request.payload

    const application = await this.applicationService.save(grantId, answers)

    return h.response(application).code(201)
  }

  async findAll() {
    return this.applicationService.findAll()
  }

  async findById(request) {
    const { applicationId } = request.params

    return this.applicationService.findById(applicationId)
  }

  async update(request) {
    const { applicationId } = request.params
    const { payload } = request

    return this.applicationService.update(applicationId, payload)
  }

  async delete(request) {
    const { applicationId } = request.params
    return this.applicationService.delete(applicationId)
  }

  async postMessage(request, h) {
    const { applicationId } = request.params
    const message = request.payload

    const application = await this.applicationService.postMessage(
      applicationId,
      message
    )

    return h.response(application).code(201)
  }
}
