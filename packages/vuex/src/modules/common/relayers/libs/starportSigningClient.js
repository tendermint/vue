import { SigningStargateClient } from '@cosmjs/stargate'
import { sha256 } from '@cosmjs/crypto'
import { sleep } from '@cosmjs/utils'

// This is a wrapper around SigningStargateClient that waits up to an additional 1 minute for a Tx to be committed regardless of rpc endpoint timeout response

export default class StarportSigningClient extends SigningStargateClient {
	async signAndBroadcast(signerAddress, messages, fee, memo = '') {
		return super.signAndBroadcast(signerAddress, messages, fee, memo)
	}
	async broadcastTx(tx) {
		let result
		try {
			result = await super.broadcastTx(tx)
			return result
		} catch (e) {
			try {
				let error = JSON.parse(e.message)
				if (error.code == -32603 && error.data == 'timed out waiting for tx to be included in a block') {
					let txHash = sha256(tx)
					let i = 0
					while (i < 20) {
						try {
							let res = await this.tmClient.tx({
								hash: txHash,
								prove: true,
							})
							return {
								height: res.height,
								code: res.result.code,
								rawLog: res.result.log,
							}
						} catch (e) {
							console.log('Waiting for tx to be included in a block')
						}
						i++
						await sleep(3000)
					}
					throw e
				} else {
					throw e
				}
			} catch (notjson) {
				throw e
			}
		}
	}
}
