import StarportSigningClient from './libs/starportSigningClient'
import SpVuexError from '../../../errors/SpVuexError'
import { IbcClient, Link } from '@confio/relayer/build'
import { Registry, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { stringToPath } from '@cosmjs/crypto'
import { sleep } from '@cosmjs/utils'
import { GasPrice } from '@cosmjs/launchpad'
import { defaultRegistryTypes } from '@cosmjs/stargate'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
import { MsgTransfer } from '@confio/relayer/build/codec/ibc/applications/transfer/v1/tx'
import {
	MsgAcknowledgement,
	MsgChannelOpenAck,
	MsgChannelOpenConfirm,
	MsgChannelOpenInit,
	MsgChannelOpenTry,
	MsgRecvPacket,
	MsgTimeout,
} from '@confio/relayer/build/codec/ibc/core/channel/v1/tx'
import { MsgCreateClient, MsgUpdateClient } from '@confio/relayer/build/codec/ibc/core/client/v1/tx'
import {
	MsgConnectionOpenAck,
	MsgConnectionOpenConfirm,
	MsgConnectionOpenInit,
	MsgConnectionOpenTry,
} from '@confio/relayer/build/codec/ibc/core/connection/v1/tx'

function ibcRegistry() {
	return new Registry([
		...defaultRegistryTypes,
		['/ibc.core.client.v1.MsgCreateClient', MsgCreateClient],
		['/ibc.core.client.v1.MsgUpdateClient', MsgUpdateClient],
		['/ibc.core.connection.v1.MsgConnectionOpenInit', MsgConnectionOpenInit],
		['/ibc.core.connection.v1.MsgConnectionOpenTry', MsgConnectionOpenTry],
		['/ibc.core.connection.v1.MsgConnectionOpenAck', MsgConnectionOpenAck],
		['/ibc.core.connection.v1.MsgConnectionOpenConfirm', MsgConnectionOpenConfirm],
		['/ibc.core.channel.v1.MsgChannelOpenInit', MsgChannelOpenInit],
		['/ibc.core.channel.v1.MsgChannelOpenTry', MsgChannelOpenTry],
		['/ibc.core.channel.v1.MsgChannelOpenAck', MsgChannelOpenAck],
		['/ibc.core.channel.v1.MsgChannelOpenConfirm', MsgChannelOpenConfirm],
		['/ibc.core.channel.v1.MsgRecvPacket', MsgRecvPacket],
		['/ibc.core.channel.v1.MsgAcknowledgement', MsgAcknowledgement],
		['/ibc.core.channel.v1.MsgTimeout', MsgTimeout],
		['/ibc.applications.transfer.v1.MsgTransfer', MsgTransfer],
	])
}
const getDefaultState = () => {
	return {
		relayers: [],
		transientLog: {
			msg: '',
		},
		relayerLinks: {},
	}
}
// initial state
const state = getDefaultState()
export default {
	namespaced: true,
	state,
	getters: {
		getRelayer: (state) => (name) => {
			return state.relayers.find((x) => x.name == name)
		},
		getRelayers: (state) => state.relayers,
		getRelayerLink: (state) => (name) => {
			return state.relayerLinks[name]
		},
		chainFromChannel: (state) => (channel) => {
			return state.relayers.find((x) => x.status == 'connected' && x.src?.channelId == channel)?.chainIdB ?? channel
		},
		chainToChannel: (state) => (channel) => {
			return state.relayers.find((x) => x.status == 'connected' && x.dest?.channelId == channel)?.chainIdB ?? channel
		},
		log: (state) => state.transientLog.msg,
	},
	mutations: {
		RESET_STATE(state) {
			Object.assign(state, getDefaultState())
		},
		SET_RELAYERS(state, relayers) {
			state.relayers = relayers
		},
		CREATE_RELAYER(state, relayer) {
			state.relayers = [...state.relayers, relayer]
		},
		LINK_RELAYER(state, { name, link, ...linkDetails }) {
			let relayerIndex = state.relayers.findIndex((x) => x.name == name)
			if (state.relayers[relayerIndex].status == 'connected') {
				state.relayers[relayerIndex] = {
					...state.relayers[relayerIndex],
					...linkDetails,
					status: 'connected',
				}
			} else {
				state.relayers[relayerIndex] = {
					...state.relayers[relayerIndex],
					...linkDetails,
					status: 'linked',
				}
			}
			state.relayerLinks[name] = link
		},
		CONNECT_RELAYER(state, { name, ...channelDetails }) {
			let relayerIndex = state.relayers.findIndex((x) => x.name == name)
			state.relayers[relayerIndex] = {
				...state.relayers[relayerIndex],
				...channelDetails,
				status: 'connected',
			}
		},
		RUN_RELAYER(state, name) {
			state.relayers.find((x) => x.name == name).running = true
		},
		STOP_RELAYER(state, name) {
			state.relayers.find((x) => x.name == name).running = false
		},
		SET_LOG_MSG(state, msg) {
			state.transientLog.msg = msg
		},
		LAST_QUERIED_HEIGHTS(state, { name, heights }) {
			state.relayers.find((x) => x.name == name).heights = heights
		},
	},
	actions: {
		init({ commit, rootGetters, dispatch }) {
			commit('RESET_STATE')
			const relayers = rootGetters['common/wallet/relayers']
			commit('SET_RELAYERS', relayers)
			relayers.forEach((relayer) => {
				if (relayer.status == 'linked' || relayer.status == 'connected') {
					dispatch('loadRelayer', relayer.name)
				}
			})
		},
		async createRelayer(
			{ commit, rootGetters, getters, dispatch },
			{ name, prefix, endpoint, gasPrice, chainId, channelId, external },
		) {
			let relayer
			if (!external) {
				relayer = {
					name,
					prefix,
					endpoint,
					gasPrice,
					external: false,
					status: 'created',
					heights: {},
					running: false,
				}
			} else {
				relayer = {
					name,
					external: true,
					status: 'connected',
					chainIdB: chainId,
					src: {
						channelId: channelId,
					},
				}
			}
			if (!external) {
				const signerA = await DirectSecp256k1HdWallet.fromMnemonic(rootGetters['common/wallet/getMnemonic'], {
					HDpaths: [stringToPath(rootGetters['common/wallet/getPath'])],
					prefix: rootGetters['common/env/addrPrefix'],
				})
				const signerB = await DirectSecp256k1HdWallet.fromMnemonic(rootGetters['common/wallet/getMnemonic'], {
					HDPaths: [stringToPath(rootGetters['common/wallet/getPath'])],
					prefix: relayer.prefix,
				})
				const [accountB] = await signerB.getAccounts()
				const optionsA = {
					prefix: rootGetters['common/env/addrPrefix'],
					gasPrice: GasPrice.fromString(rootGetters['common/wallet/gasPrice']),
					registry: ibcRegistry(),
				}
				const tmClientA = await Tendermint34Client.connect(rootGetters['common/env/apiTendermint'])
				const signingClientA = new StarportSigningClient(tmClientA, signerA, optionsA)
				relayer.chainIdA = await signingClientA.getChainId()
				const optionsB = {
					prefix: relayer.prefix,
					gasPrice: GasPrice.fromString(relayer.gasPrice),
					registry: ibcRegistry(),
				}
				const tmClientB = await Tendermint34Client.connect(relayer.endpoint)
				const signingClientB = new StarportSigningClient(tmClientB, signerB, optionsB)
				relayer.chainIdB = await signingClientB.getChainId()
				relayer.targetAddress = accountB.address
			}
			commit('CREATE_RELAYER', relayer)
			dispatch('common/wallet/updateRelayers', getters['getRelayers'], {
				root: true,
			})
		},
		async loadRelayer({ commit, rootGetters, getters, dispatch }, name) {
			const relayer = getters['getRelayer'](name)
			if (relayer.status !== 'linked' && relayer.status !== 'connected') {
				throw new SpVuexError('relayers:connectRelayer', 'Relayer already connected.')
			}
			try {
				const signerA = await DirectSecp256k1HdWallet.fromMnemonic(rootGetters['common/wallet/getMnemonic'], {
					HDPaths: [stringToPath(rootGetters['common/wallet/getPath'])],
					prefix: rootGetters['common/env/addrPrefix'],
				})
				const signerB = await DirectSecp256k1HdWallet.fromMnemonic(rootGetters['common/wallet/getMnemonic'], {
					HDPaths: [stringToPath(rootGetters['common/wallet/getPath'])],
					prefix: relayer.prefix,
				})
				const [accountA] = await signerA.getAccounts()
				const [accountB] = await signerB.getAccounts()
				const transientLog = {
					log: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					info: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					error: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					warn: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					verbose: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					debug: () => {
						//commit('SET_LOG_MSG',msg)
					},
				}
				const optionsA = {
					prefix: rootGetters['common/env/addrPrefix'],
					logger: transientLog,
					gasPrice: GasPrice.fromString(rootGetters['common/wallet/gasPrice']),
					registry: ibcRegistry(),
				}
				const tmClientA = await Tendermint34Client.connect(rootGetters['common/env/apiTendermint'])
				const signingClientA = new StarportSigningClient(tmClientA, signerA, optionsA)
				const chainIdA = await signingClientA.getChainId()
				const optionsB = {
					prefix: relayer.prefix,
					logger: transientLog,
					gasPrice: GasPrice.fromString(relayer.gasPrice),
					registry: ibcRegistry(),
				}
				const tmClientB = await Tendermint34Client.connect(relayer.endpoint)
				const signingClientB = new StarportSigningClient(tmClientB, signerB, optionsB)
				const chainIdB = await signingClientB.getChainId()

				let clientA = new IbcClient(signingClientA, tmClientA, accountA.address, chainIdA, optionsA)
				let clientB = new IbcClient(signingClientB, tmClientB, accountB.address, chainIdB, optionsB)
				const link = await Link.createWithExistingConnections(
					clientA,
					clientB,
					relayer.endA.connectionID,
					relayer.endB.connectionID,
				)
				const linkData = {
					name,
					link,
					chainIdA,
					chainIdB,
					endA: {
						clientID: link.endA.clientID,
						connectionID: link.endA.connectionID,
					},
					endB: {
						clientID: link.endB.clientID,
						connectionID: link.endB.connectionID,
					},
				}
				commit('LINK_RELAYER', linkData)
				dispatch('common/wallet/updateRelayers', getters['getRelayers'], {
					root: true,
				})
				if (relayer.status != 'connected') {
					await dispatch('connectRelayer', relayer.name)
				} else {
					if (relayer.running) {
						dispatch('runRelayer', relayer.name)
					}
				}
			} catch (e) {
				console.error(e)
			}
		},
		async linkRelayer({ commit, rootGetters, getters, dispatch }, { name }) {
			const relayer = getters['getRelayer'](name)
			if (relayer.status !== 'created') {
				throw new SpVuexError('relayers:connectRelayer', 'Relayer already connected.')
			}
			try {
				const signerA = await DirectSecp256k1HdWallet.fromMnemonic(rootGetters['common/wallet/getMnemonic'], {
					HDPaths: [stringToPath(rootGetters['common/wallet/getPath'])],
					prefix: rootGetters['common/env/addrPrefix'],
				})
				const signerB = await DirectSecp256k1HdWallet.fromMnemonic(rootGetters['common/wallet/getMnemonic'], {
					HDPaths: [stringToPath(rootGetters['common/wallet/getPath'])],
					prefix: relayer.prefix,
				})
				const [accountA] = await signerA.getAccounts()
				const [accountB] = await signerB.getAccounts()
				const transientLog = {
					log: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					info: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					error: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					warn: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					verbose: (msg) => {
						commit('SET_LOG_MSG', msg)
					},
					debug: () => {
						//commit('SET_LOG_MSG',msg)
					},
				}
				const optionsA = {
					prefix: rootGetters['common/env/addrPrefix'],
					logger: transientLog,
					gasPrice: GasPrice.fromString(rootGetters['common/wallet/gasPrice']),
					registry: ibcRegistry(),
				}
				const tmClientA = await Tendermint34Client.connect(rootGetters['common/env/apiTendermint'])
				const signingClientA = new StarportSigningClient(tmClientA, signerA, optionsA)
				const chainIdA = await signingClientA.getChainId()
				const optionsB = {
					prefix: relayer.prefix,
					logger: transientLog,
					gasPrice: GasPrice.fromString(relayer.gasPrice),
					registry: ibcRegistry(),
				}
				const tmClientB = await Tendermint34Client.connect(relayer.endpoint)
				const signingClientB = new StarportSigningClient(tmClientB, signerB, optionsB)
				const chainIdB = await signingClientB.getChainId()

				let clientA = new IbcClient(signingClientA, tmClientA, accountA.address, chainIdA, optionsA)
				let clientB = new IbcClient(signingClientB, tmClientB, accountB.address, chainIdB, optionsB)
				const link = await Link.createWithNewConnections(clientA, clientB)
				const linkData = {
					name,
					link,
					chainIdA,
					chainIdB,
					endA: {
						clientID: link.endA.clientID,
						connectionID: link.endA.connectionID,
					},
					endB: {
						clientID: link.endB.clientID,
						connectionID: link.endB.connectionID,
					},
				}
				commit('LINK_RELAYER', linkData)
				dispatch('common/wallet/updateRelayers', getters['getRelayers'], {
					root: true,
				})
				await dispatch('connectRelayer', name)
			} catch (e) {
				console.error(e)
			}
		},
		async connectRelayer({ commit, getters, dispatch }, name) {
			const relayerLink = getters['getRelayerLink'](name)
			const channels = await relayerLink.createChannel('A', 'transfer', 'transfer', 1, 'ics20-1')
			const channelData = {
				name,
				...channels,
			}
			commit('CONNECT_RELAYER', channelData)
			dispatch('common/wallet/updateRelayers', getters['getRelayers'], {
				root: true,
			})
			dispatch('runRelayer', name)
		},
		async runRelayer({ commit, getters, dispatch }, name) {
			const relayerLink = getters['getRelayerLink'](name)
			commit('RUN_RELAYER', name)
			dispatch('common/wallet/updateRelayers', getters['getRelayers'], {
				root: true,
			})
			dispatch('relayerLoop', {
				name,
				link: relayerLink,
				options: { poll: 1, maxAgeDest: 86400, maxAgeSrc: 86400 },
			})
		},
		async stopRelayer({ commit }, name) {
			commit('STOP_RELAYER', name)
		},
		async relayerLoop({ getters, commit, dispatch }, { name, link, options }) {
			let relayer = getters['getRelayer'](name)
			let nextRelay = relayer.heights ?? {}
			while (getters['getRelayer'](name).running) {
				try {
					// TODO: make timeout windows more configurable
					nextRelay = await link.checkAndRelayPacketsAndAcks(nextRelay, 2, 6)
					commit('LAST_QUERIED_HEIGHTS', { name, heights: nextRelay })
					dispatch('common/wallet/updateRelayers', getters['getRelayers'], {
						root: true,
					})
					await link.updateClientIfStale('A', options.maxAgeDest)
					await link.updateClientIfStale('B', options.maxAgeSrc)
				} catch (e) {
					console.error(`Caught error: `, e)
				}
				await sleep(options.poll * 1000)
			}
		},
	},
}
