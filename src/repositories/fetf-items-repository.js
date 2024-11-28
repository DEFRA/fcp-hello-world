import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Lifetime, RESOLVER } from 'awilix'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const load = (grantId) => {
  const grant = {
    categories: [],
    items: {}
  }

  const id = grantId.toLowerCase()
  const grantDir = path.resolve(__dirname, `./data/grants/${id}`)

  const itemsDir = path.join(grantDir, 'items')
  const files = fs.readdirSync(itemsDir)

  for (const file of files) {
    if (path.extname(file) === '.json') {
      const filePath = path.join(itemsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const item = JSON.parse(content)
      grant.items[item.itemCode] = item
    }
  }

  const content = fs.readFileSync(
    path.join(grantDir, 'categories.json'),
    'utf-8'
  )
  grant.categories = JSON.parse(content)

  return grant
}

export class FetfItemsRepository {
  db = {
    DG1: load('dg1'),
    SL1: load('sl1')
  }

  async findById(grantId, id) {
    return this.db[grantId].items[id]
  }

  async findByCodes(grantId, codes) {
    return Object.values(this.db[grantId].items).filter((item) =>
      codes.includes(item.itemCode)
    )
  }

  async findAllItems(grantId, queryCategories, text) {
    let items = Object.values(this.db[grantId].items)

    if (queryCategories?.length) {
      items = items.filter((item) =>
        item.category.some((c) => queryCategories.includes(c))
      )
    }

    const searchTerm = text?.toLowerCase()

    if (searchTerm) {
      items = items.filter(
        (item) =>
          item.itemCode === searchTerm ||
          item.title.toLowerCase().includes(searchTerm)
      )
    }

    return items
  }

  async findAllCategories(grantId) {
    return this.db[grantId].categories
  }
}

FetfItemsRepository[RESOLVER] = {
  lifetime: Lifetime.SINGLETON
}
