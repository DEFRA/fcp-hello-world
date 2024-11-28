import { randomUUID } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { Lifetime, RESOLVER } from 'awilix'
import { Role } from '../models/role.js'

export default class UserRepository {
  users = Array(3)
    .fill(null)
    .map(this.createFake)
    .reduce((acc, user) => {
      acc[user.id] = user

      return acc
    }, {})

  async save(user) {
    const id = randomUUID()

    this.users[id] = {
      id,
      ...user
    }

    return this.users[id]
  }

  async update(user) {
    const { id } = user

    this.users[id] = {
      ...this.users[id],
      ...user
    }

    return this.users[id]
  }

  async delete(userId) {
    delete this.users[userId]
  }

  async findById(userId) {
    return this.users[userId]
  }

  async findByIds(userIds) {
    return Object.values(this.users).filter((user) => userIds.includes(user.id))
  }

  async findAll() {
    return Object.values(this.users)
  }

  async findByRole(role) {
    return Object.values(this.users).filter((user) => user.role === role)
  }

  createFake() {
    const id = faker.string.uuid()
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet
      .email({
        firstName,
        lastName,
        provider: 'defra.gov.uk'
      })
      .toLowerCase()

    return {
      id,
      firstName,
      lastName,
      email,
      role: Role.CaseWorker
    }
  }
}

UserRepository[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
