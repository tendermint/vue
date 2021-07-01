import { App as Application } from 'vue'
import SpWelcome from './SpWelcome.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpWelcome)
	},
}

export default SpWelcome
