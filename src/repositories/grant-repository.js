import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { Lifetime, RESOLVER } from 'awilix'
import { areIntervalsOverlapping } from 'date-fns'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const load = (grantId) => {
  const grantDir = path.resolve(
    __dirname,
    `./data/grants/${grantId}/definition.json`
  )
  const content = fs.readFileSync(grantDir, 'utf-8')
  return JSON.parse(content)
}

export default class GrantRepository {
  grants = {
    DG1: load('dg1'),
    SL1: load('sl1')
  }

  async save(grant) {
    const id = randomUUID()

    this.grants[id] = {
      id,
      ...grant
    }

    return this.grants[id]
  }

  async update(grant) {
    const { id } = grant

    this.grants[id] = {
      ...this.grants[id],
      ...grant
    }

    return this.grants[id]
  }

  async delete(grantId) {
    delete this.grants[grantId]
  }

  async findById(grantId) {
    return this.grants[grantId]
  }

  async findAll() {
    return Object.values(this.grants)
  }

  async findActive(range) {
    return Object.values(this.grants).filter((grant) =>
      areIntervalsOverlapping(
        {
          start: grant.startDate,
          end: grant.endDate
        },
        range
      )
    )
  }

  async applyForGrant(grantId, application) {
    const id = randomUUID()

    this.grants[grantId].applications[id] = {
      id,
      ...application
    }
  }
}

GrantRepository[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
