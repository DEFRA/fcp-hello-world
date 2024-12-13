export default class GovformsApplicationMapperService {
  mappings = {
    SL1: {
      whatTypeOfLifestock: 'typeOfLivetock', // TODO typo
      currentNoOfMonthsOfSlurryStorageCapacity:
        'existingMonthsOfSlurryCapacity',
      currentNoOfSlurryStores: 'totalNumberOfStores',
      currentTypesOfSlurryStores: 'currentTypesOfSlurryStores', // NOT SURE
      currentAboveGroundSteelSlurryStoreCapacity:
        'aboveGroundSlurryStoresCapacity',
      currentEarchBankLagoonsWithoutSyntheticLinerCapacity:
        'earthBankLagoonsWithoutSyntheticLinerCapacity', // TODO typo
      currentEarthBankLagoonsWithSyntheticLinerCapacity:
        'earthBankLagoonsWithSyntheticLinerCapacity',
      currentLargeVolumeSupportedSlurryBagsCapacity:
        'largeVolumeSupportedSlurryBagsCapacity',
      currentPrecastCircularConcreteSlurryStoreCapacity:
        'precastCircularConcreteSlurryStoresCapacity',
      currentPrecastRectangularConcreteSlurryStoreCapacity:
        'storesUsingPrecastRectangularConcretePanelsCapacity',
      toKeepAboveGroundSteelSlurryStoreCapacity:
        'aboveGroundSlurryStoresCapacityKept',
      toKeepEarchBankLagoonsWithoutSyntheticLinerCapacity:
        'earthBankLagoonsWithoutSyntheticLinerCapacityKept', // TODO typo
      toKeepEarthBankLagoonsWithSyntheticLinerCapacity:
        'earthBankLagoonsWithSyntheticLinerCapacityKept',
      toKeepLargeVolumeSupportedSlurryBagsCapacity:
        'largeVolumeSupportedSlurryBagsCapacityKept',
      toKeepPrecastCircularConcreteSlurryStoreCapacity:
        'precastCircularConcreteSlurryStoresCapacityKept',
      toKeepPrecastRectangularConcreteSlurryStoreCapacity:
        'storesUsingPrecastRectangularConcretePanelsCapacityKept',
      toKeepTotalNumberOfStores: 'totalStoresToKeep',
      toKeepTotalNumberOfFixedCovers: 'totalStoresToKeepFlexibleCovers',
      toKeepTotalNumberOfFloatingCovers: 'totalStoresToKeepFixedCovers',
      newTypesOfSlurryStores: 'newTypesOfSlurryStores', // TODO not sure
      newAboveGroundSteelSlurryStoreCapacity:
        'aboveGroundSteelSlurryStoreNewCapacity',
      newEarchBankLagoonsWithoutSyntheticLinerCapacity:
        'earthBankLagoonsWithoutSyntheticLinerNewCapacity', // TODO typo
      newEarthBankLagoonsWithSyntheticLinerCapacity:
        'earthBankLagoonsWithSyntheticLinerNewCapacity',
      newLargeVolumeSupportedSlurryBagsCapacity:
        'largeVolumeSupportedSlurryBagsNewCapacty', // TODO typo
      newPrecastCircularConcreteSlurryStoreCapacity:
        'precastCircularConcreteSlurryStoresNewCapacty', // TODO typo
      newPrecastRectangularConcreteSlurryStoreCapacity:
        'storesUsingPrecastRectangularConcretePanelsNewCapacity',
      storageCapacityFor6Months: 'whatIsYourRequiredSixMonthCapacity',
      numberOfNewStoresToBeAdded: 'totalNumberOfNewStores',
      numberOfFixedCoversToBeAdded:
        'totalNumberOfNewFixedFlexibleCoversNewStores',
      numberOfFloatingCoversToBeAdded:
        'totalNumberOfNewFloatingFlexibleCoversNewStores',
      items: 'items', // TODO not sure
      haveBeenTradingLongerThan3Years: 'tradingThreeYears',
      financialAccounts: 'financialEvidenceFile',
      projectFundingEvidence: 'projectFundingEvidenceFile',
      designDeclarationForm: 'designDeclarationFormFile',
      designDrawings: 'designDrawingsFile',
      planningPermissionEvidence: 'planningPermissionEvidenceFile',
      agreeToTnCs: 'agreeSubmitDeclaration'
    }
  }

  mapQuestionId(grantId, questionId) {
    return this.mappings[grantId]?.[questionId] ?? questionId
  }
}
