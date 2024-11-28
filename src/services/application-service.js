import { ApplicationInformationReceived } from '../kernel/events/application-information-received.js'
import { ApplicationSubmitted } from '../kernel/events/application-submitted.js'
import { ApplicationStatus } from '../models/application-status.js'
import { Application } from '../models/application.js'

export default class ApplicationService {
  constructor({ applicationRepository, events, grantService }) {
    this.applicationRepository = applicationRepository
    this.events = events
    this.grantService = grantService
  }

  async save(grantId, details) {
    const grant = await this.grantService.findById(grantId)

    const newApplication = new Application()

    newApplication.status = ApplicationStatus.Submitted
    newApplication.grantId = grantId
    newApplication.meta = details.meta
    newApplication.answers = details.answers

    const application = await this.applicationRepository.save(newApplication)

    const applicationSubmitted = new ApplicationSubmitted()

    applicationSubmitted.entityId = application.id
    applicationSubmitted.data = {
      grantId: grant.id
    }

    this.events.publish(applicationSubmitted)

    return application
  }

  async findAll() {
    return this.applicationRepository.findAll()
  }

  async findById(id) {
    return this.applicationRepository.findById(id)
  }

  async update(id, application) {
    return this.applicationRepository.update(id, application)
  }

  async delete(id) {
    return this.applicationRepository.delete(id)
  }

  async updateStatus(id, status) {
    const application = await this.applicationRepository.findById(id)
    application.status = status
    return this.applicationRepository.update(id, application)
  }

  async requestInformation(id, message) {
    const application = await this.applicationRepository.findById(id)

    application.status = ApplicationStatus.InformationRequested
    application.messages.push(message)

    return this.applicationRepository.update(id, application)
  }

  async postMessage(id, message) {
    const application = await this.applicationRepository.findById(id)

    application.messages.push(message)
    application.status = ApplicationStatus.InProgress

    await this.applicationRepository.update(id, application)

    const informationReceived = new ApplicationInformationReceived()
    informationReceived.entityId = id
    informationReceived.data = {
      message
    }

    this.events.publish(informationReceived)

    return application
  }

  async getValueOfApplications(applicationIds) {
    const applications =
      await this.applicationRepository.findAllByIds(applicationIds)
    return applications.reduce((acc, curr) => acc + curr.meta.value, 0)
  }
}
