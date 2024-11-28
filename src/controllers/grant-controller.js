export default class GrantController {
  routes = [
    {
      method: 'POST',
      path: '/api/grants',
      handler: this.create.bind(this)
    },
    {
      method: 'GET',
      path: '/api/grants',
      handler: this.findAll.bind(this)
    },
    {
      method: 'GET',
      path: '/api/grants/{grantId}',
      handler: this.findById.bind(this)
    },
    {
      method: 'PUT',
      path: '/api/grants/{grantId}',
      handler: this.update.bind(this)
    },
    {
      method: 'DELETE',
      path: '/api/grants/{grantId}',
      handler: this.delete.bind(this)
    },

    {
      method: 'GET',
      path: '/grants',
      handler: this.listGrantsPage.bind(this)
    },
    {
      method: 'GET',
      path: '/grants/{grantId}',
      handler: this.editGrant.bind(this)
    },
    {
      method: ['GET', 'POST'],
      path: '/grants/create',
      handler: this.createGrantPage.bind(this)
    }
  ]

  constructor({ grantService }) {
    this.grantService = grantService
  }

  async create(request, h) {
    const { payload } = request

    const grant = await this.grantService.save(payload)

    return h.response(grant).code(201)
  }

  async findById(request, h) {
    const { grantId } = request.params

    const grant = await this.grantService.findById(grantId)

    if (!grant) {
      return h.response().code(404)
    }

    return grant
  }

  async findAll() {
    return this.grantService.findAll()
  }

  async update(request, h) {
    const { grantId } = request.params
    const { payload } = request

    const grant = await this.grantService.findById(grantId)

    if (!grant) {
      return h.response().code(404)
    }

    return this.grantService.update(grantId, payload)
  }

  async delete(request, h) {
    const { grantId } = request.params

    const grant = await this.grantService.findById(grantId)

    if (!grant) {
      return h.response().code(404)
    }

    await this.grantService.delete(grantId)

    return h.response().code(204)
  }

  async editGrant(request, h) {
    const { grantId } = request.params

    const grant = await this.grantService.findById(grantId)

    if (!grant) {
      return h.response().code(404)
    }

    return h.view('grants/create', {
      nav: { grantsActive: true },
      grant
    })
  }

  async listGrantsPage(request, h) {
    const grants = await this.grantService.findAll()

    return h.view('grants/index', {
      nav: { grantsActive: true },
      grants
    })
  }

  async createGrantPage(request, h) {
    if (request.method === 'post') {
      const { name, description, questions, stages } = request.payload

      await this.grantService.save({
        name,
        description,
        questions: JSON.parse(questions),
        stages: JSON.parse(stages)
      })

      return h.redirect('/grants')
    }

    return h.view('grants/create', {
      nav: { grantsActive: true },
      name: 'Small animal grant',
      description: 'Hamsters and hedgehogs',
      questions: JSON.stringify(
        [
          {
            id: 'q1',
            question: 'Question 1?',
            type: 'string'
          },
          {
            id: 'q2',
            question: 'Question 2?',
            type: 'integer'
          }
        ],
        null,
        2
      ),
      stages: JSON.stringify(
        [
          {
            name: 'Fraud Assessment',
            description: 'Take steps to prevent fraud',
            tasks: [
              {
                description: 'Verify identity',
                isRequired: true
              }
            ]
          },
          {
            name: 'Financial Health Assessment',
            description: "Assess the applicant's financials",
            tasks: [
              {
                description: 'Assess profitability',
                isRequired: true
              }
            ]
          },
          {
            name: 'Application Assessment',
            description: 'Assess the application',
            tasks: [
              {
                description: 'Check if coffee is ready',
                isRequired: false
              },
              {
                description: 'Ensure sufficient evidence provided',
                isRequired: true
              }
            ]
          }
        ],
        null,
        2
      )
    })
  }
}
