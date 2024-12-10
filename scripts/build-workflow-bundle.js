import { writeFile } from 'node:fs/promises'
import { URL, fileURLToPath } from 'node:url'
import { bundleWorkflowCode } from '@temporalio/worker'

const temporalDir = fileURLToPath(new URL('../src/temporal', import.meta.url))

const { code } = await bundleWorkflowCode({
  workflowsPath: `${temporalDir}/temporal-workflow.js`
})

await writeFile(`${temporalDir}/../../temporal-workflow-bundle.js`, code)
