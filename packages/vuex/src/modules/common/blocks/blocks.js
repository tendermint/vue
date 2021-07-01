import axios from 'axios'
import SpVuexError from '../../../errors/SpVuexError'
import { sha256 } from '@cosmjs/crypto'
import { fromBase64, toHex } from '@cosmjs/encoding'

function formatTx({
	txHash = '',
	messages = [],
	memo = '',
	signer_infos = [],
	fee = {},
	gas_used = null,
	gas_wanted = null,
	height = null,
	code = 0,
	log = null,
}) {
	return {
		txHash,
		body: {
			messages,
			memo,
		},
		auth_info: {
			signer_infos,
			fee,
		},
		meta: {
			gas_used,
			gas_wanted,
			height,
			code,
			log,
		},
	}
}

async function getTx(apiCosmos, apiTendermint, encodedTx) {
	const txHash = sha256(fromBase64(encodedTx))
	try {
		const rpcRes = await axios.get(apiTendermint + '/tx?hash=0x' + toHex(txHash))
		const apiRes = await axios.get(apiCosmos + '/cosmos/tx/v1beta1/txs/' + toHex(txHash))
		return { rpcRes, apiRes, txHash: toHex(txHash).toUpperCase() }
	} catch (e) {
		throw 'Error fetching TX data'
	}
}
async function decodeTx(apiCosmos, apiTendermint, encodedTx) {
	const fullTx = await getTx(apiCosmos, apiTendermint, encodedTx)
	const { data } = fullTx.rpcRes
	const { height, tx_result } = data.result
	const { code, log, gas_used, gas_wanted } = tx_result
	const { body, auth_info } = fullTx.apiRes.data.tx
	const { messages, memo } = body

	return formatTx({
		txHash: fullTx.txHash,
		messages,
		memo,
		signer_infos: auth_info.signer_infos,
		fee: auth_info.fee,
		gas_used,
		gas_wanted,
		height,
		code,
		log,
	})
}

export default {
	namespaced: true,
	state() {
		return {
			blocks: [],
			size: 20,
		}
	},
	getters: {
		getBlocks: (state) => (howmany) => {
			return [...state.blocks].sort((a, b) => b.height - a.height).slice(0, howmany)
		},
		getBlockByHeight: (state) => (height) => {
			return state.blocks.find((x) => x.height == height) || {}
		},
	},
	mutations: {
		ADD_BLOCK(state, block) {
			state.blocks.push(block)
			if (state.blocks.length > state.size) {
				state.blocks.shift()
			}
		},
		RESET_STATE(state) {
			state.blocks = []
		},
		SET_SIZE(state, size) {
			state.size = size
		},
	},
	actions: {
		init({ dispatch, rootGetters }) {
			if (rootGetters['common/env/client']) {
				rootGetters['common/env/client'].on('newblock', (data) => {
					dispatch('addBlock', data)
				})
			}
		},
		async getShiftedBlock({ rootGetters }, blockHeight) {
			try {
				const blockDetails = await axios.get(rootGetters['common/env/apiTendermint'] + '/block?height=' + blockHeight)
				const txDecoded = blockDetails.data.result.block.data.txs.map(async (tx) => {
					const dec = await decodeTx(rootGetters['common/env/apiCosmos'], rootGetters['common/env/apiTendermint'], tx)
					return dec
				})
				const txs = await Promise.all(txDecoded)

				const block = {
					height: blockDetails.data.result.block.header.height,
					timestamp: blockDetails.data.result.block.header.time,
					hash: blockDetails.data.result.block_id.hash,
					details: blockDetails.data.result.block,
					txDecoded: txs,
				}

				return block
			} catch (e) {
				console.log(e)
				throw new SpVuexError('Blocks:AddBlock', 'Could not retrieve block. RPC node unavailable')
			}
		},
		async addBlock({ commit, rootGetters }, blockData) {
			try {
				const blockDetails = await axios.get(
					rootGetters['common/env/apiTendermint'] + '/block?height=' + blockData.data.value.block.header.height,
				)
				const txDecoded = blockData.data.value.block.data.txs.map(async (tx) => {
					const dec = await decodeTx(rootGetters['common/env/apiCosmos'], rootGetters['common/env/apiTendermint'], tx)
					return dec
				})
				const txs = await Promise.all(txDecoded)

				const block = {
					height: blockData.data.value.block.header.height,
					timestamp: blockData.data.value.block.header.time,
					hash: blockDetails.data.result.block_id.hash,
					details: blockData.data.value.block,
					txDecoded: txs,
				}

				commit('ADD_BLOCK', block)
			} catch (e) {
				throw new SpVuexError('Blocks:AddBlock', 'Could not add block. RPC node unavailable')
			}
		},
		resetState({ commit }) {
			commit('RESET_STATE')
		},
	},
}
