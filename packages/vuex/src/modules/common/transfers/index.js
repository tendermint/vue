import transfers from './transfers.js'

export default function init(store) {
	if (!store.hasModule(['common'])) {
		store.registerModule(['common'], { namespaced: true })
	}
	store.registerModule(['common', 'transfers'], transfers)
	store.subscribe((mutation) => {
		if (mutation.type == 'common/env/INITIALIZE_WS_COMPLETE') {
			store.dispatch('common/transfers/init', null, { root: true })
		}
	})
}
