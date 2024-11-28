import { Lifetime, RESOLVER } from 'awilix'

class Envelope {
  name
  data
  publishedAt
}

const all = '*'

export default class Events {
  listeners = {
    [all]: []
  }

  publish(event) {
    const name = event.constructor.name

    const envelope = new Envelope()
    envelope.name = name
    envelope.data = event
    envelope.publishedAt = new Date().toISOString()

    const eventListeners = this.listeners[name] ?? []
    const listeners = this.listeners[all].concat(eventListeners)

    for (const listener of listeners) {
      listener(envelope)
    }
  }

  subscribe(event, listener) {
    const name = event === all ? all : event.name

    this.listeners[name] ??= []
    this.listeners[name].push(listener)
  }
}

Events[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
