import { App as Application } from 'vue'
import SpStatusAPI from './SpStatusAPI.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpStatusAPI)
	},
}

export default SpStatusAPI
