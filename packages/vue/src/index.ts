/* eslint-disable */
import './styles/app.scss'
import { App as Application, Plugin } from 'vue'
import * as components from './components/index'
import { setVueInstance } from './utils/config/index'
import { registerComponent } from './utils/plugins/index'

const install: Exclude<Plugin['install'], undefined> = (
	instance: Application
) => {
	setVueInstance(instance)
	for (const componentKey in components) {
		registerComponent(instance, (components as any)[componentKey])
	}

	instance.directive('click-outside', {
		beforeMount(el, binding) {
			el.clickOutsideEvent = function (event: { target: any }) {
				if (!(el === event.target || el.contains(event.target))) {
					binding.value(event, el)
				}
			}
			document.body.addEventListener('click', el.clickOutsideEvent)
		},
		unmounted(el) {
			document.body.removeEventListener('click', el.clickOutsideEvent)
		}
	})
}

export default install
export * from './components'
