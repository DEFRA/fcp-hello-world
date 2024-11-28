export default class App {
  constructor({
    server,
    applicationSubscriber,
    caseSubscriber,
    eventSubscriber
  }) {
    this.server = server
    this.subscriptions = [
      applicationSubscriber,
      caseSubscriber,
      eventSubscriber
    ]
  }

  async start() {
    this.subscriptions.map((s) => s.subscribe())
    await this.server.start()
  }
}
