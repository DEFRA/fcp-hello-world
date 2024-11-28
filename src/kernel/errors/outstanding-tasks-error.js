export class OutstandingTasksError extends Error {
  constructor(tasks) {
    super(
      'Must complete outstanding tasks before an application can be approved'
    )
    this.tasks = tasks
  }
}
