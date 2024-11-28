import { randomUUID } from 'node:crypto'
import { Lifetime, RESOLVER } from 'awilix'

export default class ApplicationRepository {
  applications = {}

  async save(application) {
    const id = randomUUID()

    this.applications[id] = {
      id,
      ...application
    }

    return this.applications[id]
  }

  async findAll() {
    return Object.values(this.applications)
  }

  async findById(id) {
    return this.applications[id]
  }

  async findAllByIds(ids) {
    return ids.map((id) => this.applications[id])
  }

  async update(id, application) {
    this.applications[id] = {
      ...this.applications[id],
      ...application
    }

    return this.applications[id]
  }

  async delete(id) {
    delete this.applications[id]
    return true
  }
}

ApplicationRepository[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
