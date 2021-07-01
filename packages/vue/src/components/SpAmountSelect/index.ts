import { App as Application } from 'vue'
import SpAmountSelect from './SpAmountSelect.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpAmountSelect)
	},
}

export default SpAmountSelect
