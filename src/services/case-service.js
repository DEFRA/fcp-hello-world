import { OutstandingTasksError } from '../kernel/errors/outstanding-tasks-error.js'
import { ApplicationApproved } from '../kernel/events/application-approved.js'
import { ApplicationInProgress } from '../kernel/events/application-in-progress.js'
import { ApplicationInformationRequested } from '../kernel/events/application-information-requested.js'
import { ApplicationRejected } from '../kernel/events/application-rejected.js'
import { ApplicationWithdrawn } from '../kernel/events/application-withdrawn.js'
import { CaseAssigned } from '../kernel/events/case-assigned.js'
import { CaseStageCompleted } from '../kernel/events/case-stage-completed.js'
import { CaseStatusChanged } from '../kernel/events/case-status-changed.js'
import { Result } from '../kernel/result.js'
import { Case, Task } from '../models/case.js'
import { Status } from '../models/status.js'

export default class CaseService {
  constructor({
    caseRepository,
    grantService,
    events,
    temporalClient,
    logger
  }) {
    this.caseRepository = caseRepository
    this.grantService = grantService
    this.events = events
    this.temporalClient = temporalClient
    this.logger = logger
  }

  async save(applicationId, grantId) {
    const grant = await this.grantService.findById(grantId)

    const newCase = new Case()

    newCase.grantId = grant.id
    newCase.applicationId = applicationId
    newCase.status = Status.Open
    newCase.stages = grant.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      isComplete: false,
      tasks: stage.tasks.map((t) => {
        const task = new Task()

        task.id = t.id
        task.description = t.description
        task.comment = null
        task.hint = null
        task.isRequired = t.isRequired
        task.isComplete = false

        return task
      })
    }))

    const kase = await this.caseRepository.save(newCase)

    const caseStatusChanged = new CaseStatusChanged()
    caseStatusChanged.entityId = kase.id
    caseStatusChanged.data = {
      oldStatus: null,
      newStatus: kase.status
    }

    this.events.publish(caseStatusChanged)

    await this.temporalClient.runWorkflow(kase.id, applicationId)

    return kase
  }

  async findAll() {
    return this.caseRepository.findAll()
  }

  async findById(id) {
    return this.caseRepository.findById(id)
  }

  async findByStatus(status) {
    return this.caseRepository.findByStatus(status)
  }

  async delete(id) {
    return this.caseRepository.delete(id)
  }

  async assign(id, userId) {
    const kase = await this.caseRepository.findById(id)

    if (!kase) {
      throw new Error(`Case "${id}" not found`)
    }

    const updatedCase = await this.caseRepository.update(id, {
      ...kase,
      userId
    })

    const caseAssigned = new CaseAssigned()
    caseAssigned.entityId = id
    caseAssigned.data = {
      oldUserId: kase.userId,
      newUserId: updatedCase.userId
    }

    this.events.publish(caseAssigned)

    return updatedCase
  }

  async #changeStatus(kase, newStatus) {
    await this.caseRepository.update(kase.id, {
      ...kase,
      status: newStatus
    })

    const caseStatusChanged = new CaseStatusChanged()
    caseStatusChanged.entityId = kase.id
    caseStatusChanged.data = {
      oldStatus: kase.status,
      newStatus
    }

    this.events.publish(caseStatusChanged)
  }

  async startAssessment(id) {
    const kase = await this.caseRepository.findById(id)

    await this.#changeStatus(kase, Status.InProgress)

    const applicationInProgress = new ApplicationInProgress()
    applicationInProgress.entityId = kase.applicationId

    this.events.publish(applicationInProgress)

    return kase
  }

  async addTask(caseId, stageId, task) {
    const kase = await this.caseRepository.findById(caseId)
    const stage = kase.stages.find((stage) => stage.id === stageId)

    stage.tasks.push(task)

    return this.caseRepository.update(caseId, kase)
  }

  async completeTasks(caseId, stageId, tasks) {
    const kase = await this.caseRepository.findById(caseId)
    const stage = kase.stages.find((stage) => stage.id === stageId)

    for (const t of tasks) {
      const task = stage.tasks.find((st) => st.id === t.id)
      task.isComplete = t.isComplete ?? task.isComplete
      task.needsReview = t.needsReview ?? task.needsReview
      task.comment = t.comment ?? task.comment
      task.hint = t.hint ?? task.hint
    }

    stage.isComplete = stage.tasks.every((t) =>
      t.isRequired ? t.isComplete : true
    )
    stage.isPartiallyComplete = stage.tasks.some((t) => t.isComplete)
    stage.needsReview = stage.tasks.some((t) => !t.isComplete && t.needsReview)

    const updatedCase = await this.caseRepository.update(caseId, kase)

    if (stage.isComplete) {
      const caseTaskComplete = new CaseStageCompleted()
      caseTaskComplete.entityId = caseId
      caseTaskComplete.data = {
        stageId
      }

      this.events.publish(caseTaskComplete)
    }

    return updatedCase
  }

  async approveApplication(id) {
    const kase = await this.caseRepository.findById(id)

    const outstandingRequiredTasks = kase.stages
      .flatMap((s) => s.tasks)
      .filter((task) => task.isRequired && !task.isComplete)

    if (outstandingRequiredTasks.length > 0) {
      const tasks = outstandingRequiredTasks.map((task) => task.id)
      return Result.fail(new OutstandingTasksError(tasks))
    }

    await this.#changeStatus(kase, Status.Resolved)

    const applicationApproved = new ApplicationApproved()
    applicationApproved.entityId = kase.applicationId

    this.events.publish(applicationApproved)

    await this.temporalClient.signalApproved(`case-${kase.id}`)

    return Result.ok(kase)
  }

  async rejectApplication(id) {
    const kase = await this.caseRepository.findById(id)

    await this.#changeStatus(kase, Status.Resolved)

    const applicationRejected = new ApplicationRejected()
    applicationRejected.entityId = kase.applicationId

    this.events.publish(applicationRejected)

    return kase
  }

  async withdrawApplication(id) {
    const kase = await this.caseRepository.findById(id)

    await this.#changeStatus(kase, Status.Resolved)

    const applicationWithdrawn = new ApplicationWithdrawn()
    applicationWithdrawn.entityId = kase.applicationId

    this.events.publish(applicationWithdrawn)

    return kase
  }

  async requestInformation(id, message) {
    const kase = await this.caseRepository.findById(id)

    await this.#changeStatus(kase, Status.Pending)

    const applicationDetailRequested = new ApplicationInformationRequested()

    applicationDetailRequested.entityId = kase.applicationId
    applicationDetailRequested.data = {
      message
    }

    this.events.publish(applicationDetailRequested)

    return kase
  }

  async receiveInformation(applicationId) {
    const kase = await this.caseRepository.findByApplicationId(applicationId)

    await this.#changeStatus(kase, Status.InProgress)

    const applicationInProgress = new ApplicationInProgress()
    applicationInProgress.entityId = kase.applicationId

    this.events.publish(applicationInProgress)

    return kase
  }
}
