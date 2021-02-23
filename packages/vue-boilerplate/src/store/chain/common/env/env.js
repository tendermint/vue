import Client from '@starport/client-js'

export default {
	namespaced: true,
	state() {
		return {
			chainId: null,
			addrPrefix: '',
			sdkVersion: 'Stargate',
			apiCosmos: null,
			apiTendermint: null,
			apiWS: null,
			client: null,
			apiConnected: false,
			rpcConnected: false,
			wsConnected: false,
			wallet: null,
			getTXApi: '',
			account: '',
			initialized: false,
			authorized: false
		}
	},
	getters: {
		client: (state) => state.client,
		apiTendermint: (state) => state.apiTendermint,
		apiCosmos: (state) => state.apiCosmos,
		apiWS: (state) => state.apiWS,
	},
	mutations: {
		SET_CONFIG(state, config) {
			state.apiCosmos = config.apiNode
			if (config.rpcNode) {
				state.apiTendermint=config.rpcNode	
			}
			if (config.wsNode) {
				state.apiWS = config.wsNode
			}
		},
		CONNECT(state, { client }) {
			state.client = client
		},
		INITIALIZE_WS_COMPLETE(state) {
			state.initialized = true
		},
		SET_WS_STATUS(state, status) {
			state.wsConnected = status
		},
		SET_API_STATUS(state, status) {
			state.apiConnected = status
		},
		SET_RPC_STATUS(state, status) {
			state.rpcConnected = status
		}
	},
	actions: {
		async init(
			{ dispatch },
			config = {
				apiNode: 'http://localhost:1317',
				rpcNode: 'http://localhost:26657',
				wsNode: 'ws://localhost:26657/websocket',
				chainId: '',
				addrPrefix: '',
				sdkVersion: 'Stargate',
				getTXApi: 'http://localhost:26657/tx?hash=0x'
			}
		) {
			if (this._actions['chain/common/starport/init']) {
				await dispatch('chain/common/starport/init', null, { root: true })
			} else {
				await dispatch('config', config)
			}
		},
		async setConnectivity({ commit }, payload) {
			switch (payload.connection) {
				case 'ws':
					commit('SET_WS_STATUS', payload.status)
					break
				case 'api':
					commit('SET_API_STATUS', payload.status)
					break
				case 'rpc':
					commit('SET_RPC_STATUS', payload.status)
					break
			}
		},
		async config(
			{ commit, rootGetters, state, dispatch },
			config = {
				apiNode: 'http://localhost:1317',
				rpcNode: 'http://localhost:26657',
				wsNode: 'ws://localhost:26657/websocket',
				chainId: '',
				addrPrefix: '',
				sdkVersion: 'Stargate',
				getTXApi: 'http://localhost:26657/tx?hash=0x'
			}
		) {
			let client = new Client({
				apiAddr: config.apiNode,
				rpcAddr: config.rpcNode,
				wsAddr: config.wsNode
			})
			let reconnectWS = false
			let reconnectSigningClient = false
			let reconnectClient = false

			if (config.wsNode != state.wsNode) {
				reconnectWS = true
			}
			if (config.rpcNode != state.rpcNode) {
				reconnectSigningClient = true
			}
			if (config.apiNode != state.apiNode) {
				reconnectClient = true
			}
			commit('SET_CONFIG', config)
			if (this._actions['chain/common/starport/init']) {
				if (rootGetters['chain/common/starport/wasAppRestarted']) {
					reconnectWS = true
					reconnectSigningClient = true
				}
			}

			let wsClient = state.wsClient
			let apiClient = state.apiClient

			if (reconnectWS && config.wsNode) {
				wsClient = client
				wsClient.on('ws-status', (status) =>
					dispatch('setConnectivity', { connection: 'ws', status: status })
				)
				try {
					await client.connect()
				} catch (e) {
					console.log('WS Connection failed')
				}
			}
			if (reconnectSigningClient && config.rpcNode) {
				if (this._actions['chain/common/wallet/switchAPI']) {
					dispatch('chain/common/wallet/switchAPI', null, { root: true })
				}
			}
			if (
				(reconnectClient && config.apiNode && config.rpcNode) ||
				(reconnectSigningClient && config.apiNode && config.rpcNode)
			) {
				apiClient = client
				apiClient.on('api-status', (status) =>
					dispatch('setConnectivity', { connection: 'api', status: status })
				)
				apiClient.on('rpc-status', (status) =>
					dispatch('setConnectivity', { connection: 'rpc', status: status })
				)
			}
			commit('CONNECT', { apiClient, wsClient })
			if (reconnectWS) {
				commit('INITIALIZE_WS_COMPLETE')
			}
		}
	}
}
