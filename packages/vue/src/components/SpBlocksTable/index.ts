import { App as Application } from 'vue'
import SpBlocksTable from './SpBlocksTable.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpBlocksTable)
	},
}

export default SpBlocksTable
