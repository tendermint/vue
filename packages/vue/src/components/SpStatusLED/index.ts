import { App as Application } from 'vue'
import SpStatusLED from './SpStatusLED.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpStatusLED)
	},
}

export default SpStatusLED
