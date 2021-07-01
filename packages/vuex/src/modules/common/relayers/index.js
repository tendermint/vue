import relayers from './relayers.js'

export default function init(store) {
	if (!store.hasModule(['common'])) {
		store.registerModule(['common'], { namespaced: true })
	}
	store.registerModule(['common', 'relayers'], relayers)
	store.subscribe((mutation) => {
		if (mutation.type == 'common/wallet/SET_SELECTED_ADDRESS') {
			store.dispatch('common/relayers/init', null, { root: true })
		}
	})
}
