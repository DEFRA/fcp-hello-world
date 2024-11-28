export default class GrantService {
  constructor({ grantRepository }) {
    this.grantRepository = grantRepository
  }

  async save(grant) {
    return this.grantRepository.save(grant)
  }

  async findAll() {
    return this.grantRepository.findAll()
  }

  async findById(id) {
    return this.grantRepository.findById(id)
  }

  async findActive(range) {
    return this.grantRepository.findActive(range)
  }

  async update(id, grant) {
    return this.grantRepository.update({ id, ...grant })
  }

  async delete(id) {
    return this.grantRepository.delete(id)
  }
}
