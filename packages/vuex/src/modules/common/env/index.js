import env from './env.js'

export default function init(store) {
	if (!store.hasModule(['common'])) {
		store.registerModule(['common'], { namespaced: true })
	}
	store.registerModule(['common', 'env'], env)
}
