import { App as Application } from 'vue'
import SpType from './SpType.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpType)
	},
}

export default SpType
