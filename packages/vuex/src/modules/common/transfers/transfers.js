import axios from 'axios'
import SpVuexError from '../../../errors/SpVuexError'

const getDefaultState = () => {
	return {
		GetTxsEvent: {},
		_Subscriptions: new Set(),
	}
}
// initial state
const state = getDefaultState()
export default {
	namespaced: true,
	state,
	mutations: {
		RESET_STATE(state) {
			Object.assign(state, getDefaultState())
		},
		QUERY(state, { query, key, value }) {
			state[query][JSON.stringify(key)] = value
		},
		SUBSCRIBE(state, subscription) {
			state._Subscriptions.add(subscription)
		},
		UNSUBSCRIBE(state, subscription) {
			state._Subscriptions.delete(subscription)
		},
	},
	getters: {
		getGetTxsEvent: (state) => (params = {}) => {
			return state.GetTxsEvent[JSON.stringify(params)] ?? {}
		},
	},
	actions: {
		init({ dispatch, rootGetters }) {
			console.log('Vuex nodule: common.transfers initialized!')
			if (rootGetters['common/env/client']) {
				rootGetters['common/env/client'].on('newblock', () => {
					dispatch('StoreUpdate')
				})
			}
		},
		resetState({ commit }) {
			commit('RESET_STATE')
		},
		unsubscribe({ commit }, subscription) {
			commit('UNSUBSCRIBE', subscription)
		},
		async StoreUpdate({ state, dispatch }) {
			state._Subscriptions.forEach((subscription) => {
				dispatch(subscription.action, subscription.payload)
			})
		},
		async ServiceGetTxsEvent({ commit, rootGetters }, { subscribe = false, all = true, ...key }) {
			try {
				let value = (
					await axios.get(rootGetters['common/env/apiCosmos'] + '/cosmos/tx/v1beta1/txs?events=' + key.event)
				).data

				while (all && value.pagination && value.pagination.next_key != null) {
					let next_values = await axios.get(
						rootGetters['common/env/apiCosmos'] +
							'/cosmos/tx/v1beta1/txs?events=' +
							key.event +
							'&pagination.key=' +
							value.pagination.next_key,
					).data

					for (let prop of Object.keys(next_values)) {
						if (Array.isArray(next_values[prop])) {
							value[prop] = [...value[prop], ...next_values[prop]]
						} else {
							value[prop] = next_values[prop]
						}
					}
					console.log(value)
				}

				commit('QUERY', { query: 'GetTxsEvent', key, value })
				if (subscribe) commit('SUBSCRIBE', { action: 'ServiceGetTxsEvent', payload: key })
			} catch (e) {
				console.error(
					new SpVuexError('QueryClient:ServiceGetTxsEvent', 'API Node Unavailable. Could not perform query.'),
				)
			}
		},
	},
}
