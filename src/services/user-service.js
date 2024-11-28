export default class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository
  }

  async save(user) {
    return this.userRepository.save(user)
  }

  async findAll() {
    return this.userRepository.findAll()
  }

  async findById(id) {
    return this.userRepository.findById(id)
  }

  async findByIds(ids) {
    return this.userRepository.findByIds(ids)
  }

  async findByRole(role) {
    return this.userRepository.findByRole(role)
  }

  async update(id, user) {
    return this.userRepository.update({ ...user, id })
  }

  createFake() {
    return this.userRepository.createFake()
  }
}
