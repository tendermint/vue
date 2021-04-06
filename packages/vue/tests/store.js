import { createStore } from 'vuex'
import { env, starport, blocks, wallet, transfers } from '../../vuex/src'

const init = (store) => {
	transfers(store)
	starport(store)
	blocks(store)
	env(store)
	wallet(store)
}

export const store = createStore({
	state() {
		return {}
	},
	mutations: {},
	actions: {}
})

init(store)
