import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Lifetime, RESOLVER } from 'awilix'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default class SlurryStoresRepository {
  constructor() {
    this.db = {
      SL1: {
        stores: {}
      }
    }
    this.loadItems('SL1')
  }

  loadItems(grantId) {
    const storesDir = path.resolve(
      __dirname,
      `./data/grants/${grantId.toLowerCase()}/stores`
    )
    const files = fs.readdirSync(storesDir)

    for (const file of files) {
      if (path.extname(file) === '.json') {
        const filePath = path.join(storesDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const store = JSON.parse(content)
        this.db[grantId].stores[store.itemCode] = store
      }
    }
  }

  async findById(grantId, id) {
    return this.db[grantId].stores[id]
  }
}

SlurryStoresRepository[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
