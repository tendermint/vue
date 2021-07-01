import { App as Application } from 'vue'
import SpKeyArea from './SpKeyArea.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpKeyArea)
	},
}

export default SpKeyArea
