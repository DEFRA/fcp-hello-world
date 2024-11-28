import { ApplicationStatus } from './application-status.js'

export class Application {
  grantId = null
  status = ApplicationStatus.Submitted
  user = null
  answers = []
  messages = []
}
