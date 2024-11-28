export class Result {
  constructor(value, error) {
    this.value = value
    this.error = error
  }

  static ok(value) {
    return new Result(value, null)
  }

  static fail(error) {
    return new Result(null, error)
  }

  isOk() {
    return this.error === null
  }

  isFail() {
    return this.error !== null
  }
}
