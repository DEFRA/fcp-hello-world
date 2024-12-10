export default class App {
  constructor({
    server,
    applicationSubscriber,
    caseSubscriber,
    // temporalSubscriber,
    workflowSubscriber,
    eventSubscriber
  }) {
    this.server = server
    this.subscribers = [
      applicationSubscriber,
      caseSubscriber,
      // temporalSubscriber,
      workflowSubscriber,
      eventSubscriber
    ]
  }

  async start() {
    await Promise.all(this.subscribers.map((s) => s.subscribe()))
    await this.server.start()
  }
}
