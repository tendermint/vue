import { App as Application } from 'vue'
import SpWallet from './SpWallet.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpWallet)
	},
}

export default SpWallet
