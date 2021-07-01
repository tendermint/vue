import { App as Application } from 'vue'
import SpTypeList from './SpTypeList.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpTypeList)
	},
}

export default SpTypeList
