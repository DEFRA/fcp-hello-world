export default class EventService {
  constructor({ eventRepository }) {
    this.eventRepository = eventRepository
  }

  async save(event) {
    return this.eventRepository.save({
      name: event.name,
      entityId: event.data.entityId,
      publishedAt: event.publishedAt,
      data: event.data.data
    })
  }

  async findAll() {
    return this.eventRepository.findAll()
  }

  async findAllByEntityId(entityId) {
    return this.eventRepository.findAllByEntityId(entityId)
  }

  async findByName(name, range) {
    return this.eventRepository.findByName(name, range)
  }

  async findThings() {
    return this.eventRepository.findThings()
  }
}
