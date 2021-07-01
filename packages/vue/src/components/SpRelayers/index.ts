import { App as Application } from 'vue'
import SpRelayers from './SpRelayers.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpRelayers)
	},
}

export default SpRelayers
