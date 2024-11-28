import { Lifetime, RESOLVER } from 'awilix'

export default class UserDetailsRepository {
  db = {
    UD1: {
      defraId: 'UD1',
      businessName: 'Equal Experts UK Limited',
      businessPhoneNumber: '07777777777',
      businessLegalStatus: 'Limited Company',
      businessAddress: [
        'Spaces',
        'Floor 2',
        '111 Deansgate',
        'Manchester',
        'M1 9ZZ'
      ]
    }
  }

  async getUserDetails(userId) {
    return this.db[userId] ? this.db[userId] : this.db.UD1
  }
}

UserDetailsRepository[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
