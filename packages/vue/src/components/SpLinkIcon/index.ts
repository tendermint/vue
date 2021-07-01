import { App as Application } from 'vue'
import SpLinkIcon from './SpLinkIcon.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpLinkIcon)
	},
}

export default SpLinkIcon
