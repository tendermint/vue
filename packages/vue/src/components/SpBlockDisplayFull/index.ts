import { App as Application } from 'vue'
import SpBlockDisplayFull from './SpBlockDisplayFull.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpBlockDisplayFull)
	},
}

export default SpBlockDisplayFull
