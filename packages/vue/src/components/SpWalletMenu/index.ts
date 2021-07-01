import { App as Application } from 'vue'
import SpWalletMenu from './SpWalletMenu.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpWalletMenu)
	},
}

export default SpWalletMenu
