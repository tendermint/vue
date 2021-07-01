import { App as Application } from 'vue'
import SpButton from './SpButton.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpButton)
	},
}

export default SpButton
