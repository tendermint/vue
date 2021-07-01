import { App as Application } from 'vue'
import SpBlockDisplaySmall from './SpBlockDisplaySmall.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpBlockDisplaySmall)
	},
}

export default SpBlockDisplaySmall
