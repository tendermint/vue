import { App as Application } from 'vue'
import SpTypeForm from './SpTypeForm.vue'

import { registerComponent } from './../../utils/plugins/index'

export const Plugin = {
	install(vue: Application): void {
		registerComponent(vue, SpTypeForm)
	},
}

export default SpTypeForm
