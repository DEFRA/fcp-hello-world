import { randomUUID } from 'node:crypto'
import { Lifetime, RESOLVER } from 'awilix'

export default class CaseRepository {
  cases = {}

  async save(kase) {
    const id = randomUUID()

    const { id: _id, ...rest } = kase

    this.cases[id] = {
      id,
      ...rest
    }

    return this.cases[id]
  }

  async findAll() {
    return Object.values(this.cases)
  }

  async findById(id) {
    return this.cases[id]
  }

  async findByApplicationId(applicationId) {
    return Object.values(this.cases).find(
      (kase) => kase.applicationId === applicationId
    )
  }

  async findByStatus(status) {
    return Object.values(this.cases).filter((c) => c.status === status)
  }

  async update(id, kase) {
    this.cases[id] = {
      ...this.cases[id],
      ...kase
    }

    return this.cases[id]
  }

  async delete(id) {
    delete this.cases[id]
  }
}

CaseRepository[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
