import Client from '@starport/client-js'
import SpVuexError from '../../../errors/SpVuexError'

const apiNode =
	(process.env.VUE_APP_API_COSMOS && process.env.VUE_APP_API_COSMOS.replace('0.0.0.0', 'localhost')) ||
	'http://localhost:1317'
const rpcNode =
	(process.env.VUE_APP_API_TENDERMINT && process.env.VUE_APP_API_TENDERMINT.replace('0.0.0.0', 'localhost')) ||
	'http://localhost:26657'
const wsNode =
	(process.env.VUE_APP_WS_TENDERMINT && process.env.VUE_APP_WS_TENDERMINT.replace('0.0.0.0', 'localhost')) ||
	'ws://localhost:26657/websocket'
const addrPrefix = process.env.VUE_APP_ADDRESS_PREFIX || 'cosmos'

export default {
	namespaced: true,
	state() {
		return {
			chainId: '',
			addrPrefix: addrPrefix,
			sdkVersion: 'Stargate',
			apiNode: apiNode,
			rpcNode: rpcNode,
			wsNode: wsNode,
			client: null,
			chainName: '',
			apiConnected: false,
			rpcConnected: false,
			wsConnected: false,
			getTXApi: '',
			initialized: false,
		}
	},
	getters: {
		client: (state) => state.client,
		signingClient: (state) => state.client.signingClient,
		chainId: (state) => state.chainId,
		chainName: (state) => state.chainName,
		addrPrefix: (state) => state.addrPrefix,
		apiTendermint: (state) => state.rpcNode,
		apiCosmos: (state) => state.apiNode,
		apiWS: (state) => state.wsNode,
		sdkVersion: (state) => state.sdkVersion,
		apiConnected: (state) => state.apiConnected,
		rpcConnected: (state) => state.rpcConnected,
		wsConnected: (state) => state.wsConnected,
	},
	mutations: {
		SET_CONFIG(state, config) {
			state.apiNode = config.apiNode
			if (config.rpcNode || config.offline) {
				state.rpcNode = config.rpcNode
			}
			if (config.wsNode || config.offline) {
				state.wsNode = config.wsNode
			}
			if (config.chainId || config.offline) {
				state.chainId = config.chainId
			}
			if (config.addrPrefix || config.offline) {
				state.addrPrefix = config.addrPrefix
			}
			if (config.sdkVersion || config.offline) {
				state.sdkVersion = config.sdkVersion
			}
			if (config.getTXApi || config.offline) {
				state.getTXApi = config.getTXApi
			}
		},
		CONNECT(state, { client }) {
			state.client = client
		},
		INITIALIZE_WS_COMPLETE(state) {
			state.initialized = true
		},
		SET_CHAIN_ID(state, chainId) {
			state.chainId = chainId
		},
		SET_CHAIN_NAME(state, chainName) {
			state.chainName = chainName
		},
		SET_WS_STATUS(state, status) {
			state.wsConnected = status
		},
		SET_API_STATUS(state, status) {
			state.apiConnected = status
		},
		SET_RPC_STATUS(state, status) {
			state.rpcConnected = status
		},
		SET_TX_API(state, txapi) {
			state.getTXApi = txapi
		},
	},
	actions: {
		async init(
			{ dispatch },
			config = {
				starportUrl: 'http://localhost:12345',
				apiNode: apiNode,
				rpcNode: rpcNode,
				wsNode: wsNode,
				chainId: '',
				addrPrefix: addrPrefix,
				chainName: '',
				sdkVersion: 'Stargate',
				getTXApi: rpcNode + '/tx?hash=0x',
				offline: false,
				refresh: 5000,
			},
		) {
			try {
				await dispatch('config', config)
				console.log('Vuex nodule: common.env initialized!')
			} catch (e) {
				throw new SpVuexError('Env:Config', 'Could not configure environment')
			}
		},
		setTxAPI({ commit }, payload) {
			commit('SET_TX_API', payload)
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
		async signIn({ state }, signer) {
			try {
				await state.client.useSigner(signer)
			} catch (e) {
				throw new SpVuexError('Env:Client:Wallet', 'Could not create signing client with signer: ' + signer)
			}
		},
		async config(
			{ commit, state, dispatch },
			config = {
				apiNode: 'http://localhost:1317',
				rpcNode: 'http://localhost:26657',
				wsNode: 'ws://localhost:26657/websocket',
				chainName: '',
				chainId: '',
				addrPrefix: '',
				sdkVersion: 'Stargate',
				offline: false,
				refresh: 5000,
				getTXApi: 'http://localhost:26657/tx?hash=0x',
			},
		) {
			try {
				let client
				if (!state.client) {
					client = new Client({
						apiAddr: config.apiNode,
						rpcAddr: config.rpcNode,
						wsAddr: config.wsNode,
						offline: config.offline,
						refresh: config.refresh,
					})
					client.setMaxListeners(0)
					client.on('chain-id', (id) => {
						if (id) {
							commit('SET_CHAIN_ID', id)
						}
					})
					client.on('chain-name', (name) => {
						if (name) {
							commit('SET_CHAIN_NAME', name)
						}
					})
					client.on('ws-status', (status) => dispatch('setConnectivity', { connection: 'ws', status: status }))
					client.on('api-status', (status) => dispatch('setConnectivity', { connection: 'api', status: status }))
					client.on('rpc-status', (status) => dispatch('setConnectivity', { connection: 'rpc', status: status }))
					commit('SET_CONFIG', config)
					await dispatch(
						'cosmos.staking.v1beta1/QueryParams',
						{
							options: { subscribe: false, all: false },
							params: {},
							query: null,
						},
						{ root: true },
					)
					await dispatch(
						'cosmos.bank.v1beta1/QueryTotalSupply',
						{
							options: { subscribe: false, all: false },
							params: {},
							query: null,
						},
						{ root: true },
					)
					commit('CONNECT', { client })
					commit('INITIALIZE_WS_COMPLETE')
				} else {
					client = state.client
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

					if (reconnectWS && config.wsNode) {
						try {
							await client.switchWS(config.wsNode)
						} catch (e) {
							throw new SpVuexError('Env:Client:Websocket', 'Could not switch to websocket node:' + config.wsNode)
						}
					}
					if (reconnectClient && config.apiNode) {
						client.switchAPI(config.apiNode)
					}
					if (reconnectSigningClient && config.rpcNode) {
						try {
							await client.switchRPC(config.rpcNode)
						} catch (e) {
							throw new SpVuexError(
								'Env:Client:TendermintRPC',
								'Could not switch to Tendermint RPC node:' + config.rpcNode,
							)
						}
					}
				}
			} catch (e) {
				console.error(e)
			}
		},
	},
}
