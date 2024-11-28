// import Joi from '@hapi/joi';

export default class GovFormsController {
  constructor({ govformsService }) {
    this.govformsService = govformsService
  }

  routes = [
    {
      method: 'GET',
      path: '/api/govforms/user-details/{defraId}',
      handler: this.findUserDetails.bind(this)
    },
    {
      method: 'GET',
      path: '/api/govforms/{grantId}/fetf-item-categories',
      handler: this.findAllFetfCategories.bind(this)
    },
    {
      method: 'GET',
      path: '/api/govforms/{grantId}/fetf-items',
      handler: this.findAllFetfItems.bind(this)
    },
    {
      method: 'POST',
      path: '/api/govforms/{grantId}/apply',
      handler: this.processForm.bind(this)
    }
  ]

  async findUserDetails(request, h) {
    const { defraId } = request.params
    const userDetails = await this.govformsService.findUserDetailsById(defraId)

    if (userDetails) {
      return h.response(userDetails).code(200)
    }

    return h.response().code(404)
  }

  async findAllFetfCategories(request, h) {
    const { grantId } = request.params
    const categories = await this.govformsService.findFetfCategories(grantId)
    return h.response(categories).code(200)
  }

  async findAllFetfItems(request, h) {
    let { categories: queryCategories, text } = request.query
    queryCategories = queryCategories ? this.ensureArray(queryCategories) : []
    const { grantId } = request.params

    const items = await this.govformsService.findAllFetfItems(
      grantId,
      queryCategories,
      text
    )

    return h.response(items).code(200)
  }

  ensureArray(queryCategories) {
    return Array.isArray(queryCategories) ? queryCategories : [queryCategories]
  }

  async processForm(request, h) {
    const { grantId } = request.params

    await this.govformsService.processForm(grantId, request.payload)

    return h.response().code(200)
  }
}
