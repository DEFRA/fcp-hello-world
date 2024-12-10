export default class App {
  constructor({
    server,
    applicationSubscriber,
    caseSubscriber,
    // temporalSubscriber,
    eventSubscriber
  }) {
    this.server = server
    this.subscribers = [
      applicationSubscriber,
      caseSubscriber,
      // temporalSubscriber,
      eventSubscriber
    ]
  }

  async start() {
    await Promise.all(this.subscribers.map((s) => s.subscribe()))
    await this.server.start()
  }
}
