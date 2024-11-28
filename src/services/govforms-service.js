export default class GovFormsService {
  constructor({
    userDetailsRepository,
    fetfItemsRepository,
    grantService,
    applicationService,
    govformsApplicationMapper
  }) {
    this.fetfItemsRepository = fetfItemsRepository
    this.userDetailsRepository = userDetailsRepository
    this.grantService = grantService
    this.applicationService = applicationService
    this.govformsApplicationMapper = govformsApplicationMapper
  }

  async findUserDetailsById(userId) {
    return this.userDetailsRepository.getUserDetails(userId)
  }

  async findFetfCategories(grantId) {
    return this.fetfItemsRepository.findAllCategories(grantId)
  }

  async findAllFetfItems(grantId, queryCategories = [], text = '') {
    return this.fetfItemsRepository.findAllItems(grantId, queryCategories, text)
  }

  async processForm(grantId, form) {
    const grant = await this.grantService.findById(grantId)

    if (!grant) {
      throw new Error(`Grant not found ${grantId}`)
    }

    // console.log("GovForms application", application);

    // const questions = {};
    //
    // for (const question of grant.questions) {
    //    questions[question.id] = question;
    // }

    // const isValidApplication = grant.questions.every(question => {
    //    //if (question.dependsOn && !questions[question.dependsOn].required) {
    //    //    return true
    //    //}
    //
    //    if (!question.required) {
    //        return true;
    //    }
    //
    //    const value = application[question.id];
    //
    //    if (!value) {
    //        return false;
    //    }
    //
    //    if (question.type === "number") {
    //        return value => question.min && value <= question.max;
    //    }
    //
    //    if (question.type === "string") {
    //        const regex = new RegExp(question.pattern);
    //        return regex.test(value);
    //    }
    //
    //    if (question.type === "boolean") {
    //        return typeof value === "boolean";
    //    }
    //
    //    if (question.type === "list") {
    //        return value.every(v => question.items.includes(v));
    //    }
    //
    //    if (question.type === "equipment") {
    //        const count = value.length;
    //        const exceedsMaxCount = value.every(v => question.items.some(item => item.id === v.code && v.count));
    //        return count >= question.min && count <= question.max && !exceedsMaxCount;
    //    }
    //
    //    if (question.type === "files") {
    //        const count = Array.isArray(value) ? value.length : 0;
    //        return count >= question.min && count <= question.max;
    //    }
    //
    //    console.log(`Unknown question type "${question.type}"`);
    //
    //    return true;
    // });
    //
    //
    // if (!isValidApplication) {
    //    return h.response().code(400);
    // }

    const answers = grant.questions.map((question) => {
      const mappedQuestionId = this.govformsApplicationMapper.mapQuestionId(
        grantId,
        question.id
      )
      switch (question.type) {
        case 'equipment':
          return {
            id: question.id,
            type: question.type,
            question: question.label,
            answer: (Array.isArray(form.data[mappedQuestionId])
              ? form.data[mappedQuestionId]
              : []
            ).map((item) => ({
              code: item.code,
              count: item.quantity
            }))
          }
        case 'files':
          return {
            id: question.id,
            type: question.type,
            question: question.label,
            answer: (Array.isArray(form.data[mappedQuestionId])
              ? form.data[mappedQuestionId]
              : []
            ).map((item) => ({
              fileName: item.fileName,
              downloadUrl: item.downloadUrl
            }))
          }
        default:
          return {
            id: question.id,
            type: question.type,
            question: question.label,
            answer: form.data[mappedQuestionId]
          }
      }
    })

    const selectedItems = answers.find((a) => a.type === 'equipment')?.answer

    const items = await this.fetfItemsRepository.findByCodes(
      grantId,
      selectedItems.map((s) => s.code)
    )

    const value = items.reduce((acc, item) => {
      const itemValue = Number.parseInt(item.grantValue.replace(/,/g, ''), 10)
      const count = selectedItems.find((s) => s.code === item.itemCode)?.count

      return itemValue * count + acc
    }, 0)

    await this.applicationService.save(grantId, {
      meta: {
        ...form.meta,
        value
      },
      answers
    })
  }
}
