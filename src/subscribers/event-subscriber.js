export default class EventSubscriber {
  constructor({ events, eventService }) {
    this.events = events
    this.eventService = eventService
  }

  subscribe() {
    this.events.subscribe('*', this.record.bind(this))
  }

  async record(event) {
    return this.eventService.save(event)
  }
}
