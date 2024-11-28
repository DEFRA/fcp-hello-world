import { randomUUID } from 'node:crypto'
import { Lifetime, RESOLVER } from 'awilix'
import { isWithinInterval } from 'date-fns'

export default class EventRepository {
  events = {}

  async save(event) {
    const id = randomUUID()

    this.events[id] = {
      id,
      ...event
    }

    return this.events[id]
  }

  async findAll() {
    return Object.values(this.events)
  }

  async findAllByEntityId(entityId) {
    return Object.values(this.events).filter(
      (event) => event.entityId === entityId
    )
  }

  async findByName(name, range) {
    return Object.values(this.events).filter(
      (event) =>
        event.name === name && isWithinInterval(event.publishedAt, range)
    )
  }
}

EventRepository[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
