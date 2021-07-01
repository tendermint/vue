import { App as Application } from 'vue'
import SpTransferList from './SpTransferList.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpTransferList)
	},
}

export default SpTransferList
