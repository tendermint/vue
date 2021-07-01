import { App as Application } from 'vue'
import SpBlockDisplayLine from './SpBlockDisplayLine.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpBlockDisplayLine)
	},
}

export default SpBlockDisplayLine
