import { App as Application } from 'vue'
import SpBlockHeight from './SpBlockHeight.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpBlockHeight)
	},
}

export default SpBlockHeight
