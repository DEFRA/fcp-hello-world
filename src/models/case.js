export class Task {
  id
  description
  comment
  hint
  isRequired
  isComplete
  needsReview
}

export class Case {
  id = null
  userId = null
  status = null
  applicationId = null
  tasks = []
}
