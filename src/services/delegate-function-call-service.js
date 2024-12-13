export default class DelegateFunctionCallService {
  funcCallConfig = {}

  constructor({ slurryCalculationsService }) {
    this.slurryCalculationsService = slurryCalculationsService
    this.funcCallConfig['SL1:slurryCalculation'] =
      this.slurryCalculationsService.calculate.bind(
        this.slurryCalculationsService
      )
  }

  delegate(grantId, functionName, data) {
    const func = this.lookupFunction(grantId, functionName)
    return this.callFunction(func, data)
  }

  lookupFunction(grantId, functionName) {
    // This would probably first:
    // lookup in some config how to call this specific function for the grant
    // return a function that calls another endpoint by HTTP
    return this.funcCallConfig[`${grantId}:${functionName}`]
  }

  callFunction(func, params) {
    return func(params) ?? {}
  }
}
