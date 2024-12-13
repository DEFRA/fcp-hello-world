export default class SlurryCalculationsService {
  constructor({
    govformsApplicationMapperService,
    slurryStoresRepository,
    fetfItemsRepository
  }) {
    this.govformsApplicationMapperService = govformsApplicationMapperService
    this.slurryStoresRepository = slurryStoresRepository
    this.fetfItemsRepository = fetfItemsRepository
  }

  formField(grantFieldId) {
    return this.govformsApplicationMapperService.mapQuestionId(
      'SL1',
      grantFieldId
    )
  }

  formValue(form, grantFieldId) {
    return form?.[this.formField(grantFieldId)]
  }

  formNumber(form, grantFieldId) {
    const value = this.formValue(form, grantFieldId)
    const number = Number.parseFloat(value)
    return Number.isNaN(number) ? 0 : number
  }

  parseNumber(value, orElse = 0) {
    const number = Number.parseFloat(value)
    return Number.isNaN(number) ? orElse : number
  }

  async calculate(form = {}) {
    const formData = form.data

    const currentCapacities = {
      aboveGround: this.formNumber(
        formData,
        'currentAboveGroundSteelSlurryStoreCapacity'
      ),
      lagoonWithLiner: this.formNumber(
        formData,
        'currentEarthBankLagoonsWithSyntheticLinerCapacity'
      ),
      lagoonWithoutLiner: this.formNumber(
        formData,
        'currentEarchBankLagoonsWithoutSyntheticLinerCapacity'
      ),
      largeSlurryBags: this.formNumber(
        formData,
        'currentLargeVolumeSupportedSlurryBagsCapacity'
      ),
      circularConcrete: this.formNumber(
        formData,
        'currentPrecastCircularConcreteSlurryStoreCapacity'
      ),
      rectangularConcrete: this.formNumber(
        formData,
        'currentPrecastRectangularConcreteSlurryStoreCapacity'
      )
    }
    const currentCapacityTotal = Object.values(currentCapacities).reduce(
      (total, current) => total + current,
      0
    )

    const retainedCapacities = {
      aboveGround: this.formNumber(
        formData,
        'toKeepAboveGroundSteelSlurryStoreCapacity'
      ),
      lagoonWithLiner: this.formNumber(
        formData,
        'toKeepEarthBankLagoonsWithSyntheticLinerCapacity'
      ),
      lagoonWithoutLiner: this.formNumber(
        formData,
        'toKeepEarchBankLagoonsWithoutSyntheticLinerCapacity'
      ),
      largeSlurryBags: this.formNumber(
        formData,
        'toKeepLargeVolumeSupportedSlurryBagsCapacity'
      ),
      circularConcrete: this.formNumber(
        formData,
        'toKeepPrecastCircularConcreteSlurryStoreCapacity'
      ),
      rectangularConcrete: this.formNumber(
        formData,
        'toKeepPrecastRectangularConcreteSlurryStoreCapacity'
      )
    }
    const retainedCapacityTotal = Object.values(retainedCapacities).reduce(
      (total, current) => total + current,
      0
    )

    const newCapacities = {
      aboveGround: this.formNumber(
        formData,
        'newAboveGroundSteelSlurryStoreCapacity'
      ),
      lagoonWithLiner: this.formNumber(
        formData,
        'newEarthBankLagoonsWithSyntheticLinerCapacity'
      ),
      lagoonWithoutLiner: this.formNumber(
        formData,
        'newEarchBankLagoonsWithoutSyntheticLinerCapacity'
      ),
      largeSlurryBags: this.formNumber(
        formData,
        'newLargeVolumeSupportedSlurryBagsCapacity'
      ),
      circularConcrete: this.formNumber(
        formData,
        'newPrecastCircularConcreteSlurryStoreCapacity'
      ),
      rectangularConcrete: this.formNumber(
        formData,
        'newPrecastRectangularConcreteSlurryStoreCapacity'
      )
    }
    const newCapacityTotal = Object.values(newCapacities).reduce(
      (total, current) => total + current,
      0
    )

    const sixMonthCapacity =
      this.formNumber(formData, 'storageCapacityFor6Months') ?? 0

    const capacityFactor =
      (sixMonthCapacity - retainedCapacityTotal) / newCapacityTotal

    const storeTypes = [
      'aboveGround',
      'lagoonWithLiner',
      'lagoonWithoutLiner',
      'largeSlurryBags',
      'circularConcrete',
      'rectangularConcrete'
    ]

    const storeTypeItemCodes = {
      aboveGround: '1',
      lagoonWithLiner: '4',
      lagoonWithoutLiner: '3',
      largeSlurryBags: '7',
      circularConcrete: '2',
      rectangularConcrete: '5'
    }

    const futureStorageCapacities = {}
    for (const storeType of storeTypes) {
      futureStorageCapacities[storeType] = new FutureStorageRequirement(
        storeType,
        retainedCapacities[storeType],
        newCapacities[storeType] * capacityFactor,
        newCapacities[storeType] - newCapacities[storeType] * capacityFactor
      )
    }

    const totalExistingStorageRetained = Object.values(
      futureStorageCapacities
    ).reduce((total, current) => total + current.existingStorageRetained, 0)

    const totalRequiredToReachCapacity = Object.values(
      futureStorageCapacities
    ).reduce((total, current) => total + current.requiredToReachCapacity, 0)

    const totalExcessOverCapacity = Object.values(
      futureStorageCapacities
    ).reduce((total, current) => total + current.excessOverCapacity, 0)

    const storeCosts = await Promise.all(
      Object.entries(storeTypeItemCodes).map(async ([storeType, itemCode]) => {
        const units = futureStorageCapacities[storeType].requiredToReachCapacity
        const storeDetails = await this.slurryStoresRepository.findById(
          'SL1',
          itemCode
        )
        const totalExpenditure = units * storeDetails.unitCost

        return {
          units,
          totalExpenditure,
          totalGrant: totalExpenditure * storeDetails.grantRate
        }
      })
    )

    const cartCalc = async (obj, cartItem) => {
      const item = await this.fetfItemsRepository.findById(
        'SL1',
        cartItem.details?.itemCode
      )
      const units = this.parseNumber(cartItem?.quantity)
      const unitCost = this.parseNumber(item?.unitCost)
      // const grantRate = this.parseNumber(item?.grantRate)
      const total = units * unitCost
      return {
        ...obj,
        [cartItem.details?.itemCode]: {
          units,
          totalExpenditure: total,
          totalGrant: total * this.parseNumber(item.grantRate)
        }
      }
    }

    const cartItems = formData.carts.items || {}
    const itemCosts = await Object.values(cartItems).reduce(cartCalc, {})

    const totalStoresExpenditure = Object.values(storeCosts).reduce(
      (total, current) => total + current.totalExpenditure,
      0
    )

    const totalItemsExpenditure = Object.values(itemCosts).reduce(
      (total, current) => total + current.totalExpenditure,
      0
    )

    const totalExpenditure = totalStoresExpenditure + totalItemsExpenditure

    const totalStoresGrant = Object.values(storeCosts).reduce(
      (total, current) => total + current.totalGrant,
      0
    )

    const totalItemsGrant = Object.values(itemCosts).reduce(
      (total, current) => total + current.totalGrant,
      0
    )

    const totalGrant = totalStoresGrant + totalItemsGrant

    const ineligibleTotalGrant = totalGrant > 250000 ? 250000 - totalGrant : 0
    const ineligibleTotalExpenditure = ineligibleTotalGrant / 0.5

    const eligibleTotalExpenditure =
      totalExpenditure + ineligibleTotalExpenditure
    const eligibleTotalGrant = totalGrant + ineligibleTotalGrant

    const output = {
      workings: {
        capacities: {
          currentCapacities,
          totalCurrentCapacities: currentCapacityTotal,
          retainedCapacities,
          totalRetainedCapacities: retainedCapacityTotal,
          newCapacities,
          totalNewCapacities: newCapacityTotal
        },
        sixMonthCapacity,
        capacityFactor,
        futureStorageCapacities,
        totalExistingStorageRetained,
        totalRequiredToReachCapacity,
        totalExcessOverCapacity,
        storeCosts,
        itemCosts,
        totalStoresExpenditure,
        totalItemsExpenditure,
        totalExpenditure,
        totalStoresGrant,
        totalItemsGrant,
        totalGrant
      },
      ineligibleTotalGrant: Number.isNaN(ineligibleTotalGrant)
        ? 0
        : ineligibleTotalGrant,
      ineligibleTotalExpenditure: Number.isNaN(ineligibleTotalExpenditure)
        ? 0
        : ineligibleTotalExpenditure,
      eligibleTotalExpenditure: Number.isNaN(eligibleTotalExpenditure)
        ? 0
        : eligibleTotalExpenditure,
      eligibleTotalGrant: Number.isNaN(eligibleTotalGrant)
        ? 0
        : eligibleTotalGrant
    }

    return output
  }
}

class FutureStorageRequirement {
  constructor(
    storeType,
    existingStorageRetained,
    requiredToReachCapacity,
    excessOverCapacity
  ) {
    this.storeType = storeType
    this.existingStorageRetained = existingStorageRetained
    this.requiredToReachCapacity = requiredToReachCapacity
    this.excessOverCapacity = excessOverCapacity
  }
}
