import { App as Application } from 'vue'
import SpRelayer from './SpRelayer.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpRelayer)
	},
}

export default SpRelayer
