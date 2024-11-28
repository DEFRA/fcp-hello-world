import { ReadableRole, Role } from '../models/role.js'
import { Status } from '../models/status.js'

export default class UserController {
  routes = [
    {
      method: 'POST',
      path: '/api/users',
      handler: this.create.bind(this)
    },
    {
      method: 'GET',
      path: '/api/users',
      handler: this.findAll.bind(this)
    },
    {
      method: 'GET',
      path: '/api/users/{userId}',
      handler: this.findById.bind(this)
    },
    {
      method: 'PUT',
      path: '/api/users/{userId}',
      handler: this.update.bind(this)
    },
    {
      method: 'DELETE',
      path: '/api/users/{userId}',
      handler: this.delete.bind(this)
    },

    {
      method: 'GET',
      path: '/users',
      handler: this.listUsersPage.bind(this)
    },
    {
      method: ['GET', 'POST'],
      path: '/users/create',
      handler: this.createUserPage.bind(this)
    }
  ]

  constructor({ userService, caseService }) {
    this.userService = userService
    this.caseService = caseService
  }

  async create(request, h) {
    const { payload } = request

    const user = await this.userService.save(payload)

    return h.response(user).code(201)
  }

  async findAll() {
    return this.userService.findAll()
  }

  async findById(request, h) {
    const { id } = request.params

    const user = await this.userService.findById(id)

    if (!user) {
      return h.response().code(404)
    }

    return user
  }

  async update(request, h) {
    const { id } = request.params
    const { payload } = request

    const user = await this.userService.findById(id)

    if (!user) {
      return h.response().code(404)
    }

    return this.userService.update(id, payload)
  }

  async delete(request, h) {
    const { id } = request.params

    const user = await this.userService.findById(id)

    if (!user) {
      return h.response().code(404)
    }

    await this.userService.delete(id)

    return h.response().code(204)
  }

  async listUsersPage(request, h) {
    const [caseWorkers, openCases] = await Promise.all([
      this.userService.findByRole(Role.CaseWorker),
      this.caseService.findByStatus(Status.Open)
    ])

    const casesPerWorker = openCases.reduce((acc, kase) => {
      acc[kase.userId] ??= 0
      acc[kase.userId]++

      return acc
    }, {})

    const users = caseWorkers.map((worker) => ({
      ...worker,
      role: ReadableRole[worker.role],
      caseCount: casesPerWorker[worker.id] || 0
    }))

    return h.view('users/index', {
      nav: { usersActive: true },
      users
    })
  }

  async createUserPage(request, h) {
    if (request.method === 'post') {
      await this.userService.save(request.payload)

      return h.redirect('/users')
    }

    const fake = this.userService.createFake()

    return h.view('users/create', {
      nav: { usersActive: true },
      ...fake,
      roles: Object.values(Role).map((role) => ({
        value: role,
        text: ReadableRole[role],
        selected: role === Role.CaseWorker
      }))
    })
  }
}
