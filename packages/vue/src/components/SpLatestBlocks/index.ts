import { App as Application } from 'vue'
import SpLatestBlocks from './SpLatestBlocks.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpLatestBlocks)
	},
}

export default SpLatestBlocks
