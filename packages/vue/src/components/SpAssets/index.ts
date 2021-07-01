import { App as Application } from 'vue'
import SpAssets from './SpAssets.vue'

import { registerComponent } from '../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpAssets)
	},
}

export default SpAssets
