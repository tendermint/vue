<template>
	<div class="sp-component sp-transfer-list" v-if="depsLoaded">
		<div class="sp-transfer-list__header sp-component-title">
			<h3>Transactions</h3>
			<span>|</span>
			<span>A list of your recent transactions</span>
		</div>
		<table class="sp-transfer-list__table sp-box sp-shadow" v-if="address && transactions.length > 0">
			<thead>
				<tr>
					<th class="sp-transfer-list__status">STATUS</th>
					<th class="sp-transfer-list__table__address">ADDRESS / DETAILS</th>
					<th class="sp-transfer-list__table__amount">AMOUNT</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="tx in transactions" v-bind:key="tx.response.hash">
					<td class="sp-transfer-list__status">
						<div class="sp-transfer-list__status__wrapper">
							<div
								class="sp-transfer-list__status__icon"
								:class="{
									'sp-transfer-list__status__icon__failed': tx.response.code != 0,
									'sp-transfer-list__status__icon__sent':
										tx.response.code == 0 &&
										(tx.body.messages[0].from_address == bankAddress || tx.body.messages[0].sender == bankAddress),
									'sp-transfer-list__status__icon__received':
										tx.response.code == 0 &&
										(tx.body.messages[0].to_address == bankAddress ||
											(tx.body.messages[0]['@type'] == '/ibc.core.channel.v1.MsgRecvPacket' &&
												getDecoded(tx.body.messages[0].packet?.data ?? '')?.receiver == bankAddress)),
									'sp-transfer-list__status__icon__success':
										tx.response.code == 0 &&
										tx.body.messages[0].to_address != bankAddress &&
										tx.body.messages[0].from_address != bankAddress &&
										tx.body.messages[0].sender != bankAddress &&
										!(
											tx.body.messages[0]['@type'] == '/ibc.core.channel.v1.MsgRecvPacket' &&
											getDecoded(tx.body.messages[0].packet?.data ?? '')?.receiver == bankAddress
										),
								}"
							>
								<span
									class="sp-icon"
									:class="{
										'sp-icon-Close': tx.response.code != 0,
										'sp-icon-UpArrow':
											tx.response.code == 0 &&
											(tx.body.messages[0].from_address == bankAddress || tx.body.messages[0].sender == bankAddress),
										'sp-icon-DownArrow':
											tx.response.code == 0 &&
											(tx.body.messages[0].to_address == bankAddress ||
												(tx.body.messages[0]['@type'] == '/ibc.core.channel.v1.MsgRecvPacket' &&
													getDecoded(tx.body.messages[0].packet?.data ?? '')?.receiver == bankAddress)),
										'sp-icon-Docs':
											tx.response.code == 0 &&
											tx.body.messages[0].to_address != bankAddress &&
											tx.body.messages[0].from_address != bankAddress &&
											tx.body.messages[0].sender != bankAddress &&
											!(
												tx.body.messages[0]['@type'] == '/ibc.core.channel.v1.MsgRecvPacket' &&
												getDecoded(tx.body.messages[0].packet?.data ?? '')?.receiver == bankAddress
											),
									}"
								/>
							</div>
							<div class="sp-transfer-list__status__action">
								<div class="sp-transfer-list__status__action__text">
									{{ getTxText(tx) }}
								</div>
								<div class="sp-transfer-list__status__action__date">
									{{ getFmtTime(tx.response.timestamp) }}
								</div>
							</div>
						</div>
					</td>
					<td class="sp-transfer-list__table__address">
						{{ getTxDetails(tx) }}
					</td>
					<td
						class="sp-transfer-list__table__amount"
						v-if="tx.body.messages[0]['@type'] == '/cosmos.bank.v1beta1.MsgSend'"
					>
						<div v-for="(token, index) in getAmounts(tx)" v-bind:key="'am' + index">
							{{
								tx.body.messages[0].from_address == bankAddress
									? '-' + token.amount + ' ' + token.denom.toUpperCase()
									: '+' + token.amount + ' ' + token.denom.toUpperCase()
							}}
						</div>
					</td>
					<td
						class="sp-transfer-list__table__amount"
						v-else-if="tx.body.messages[0]['@type'] == '/ibc.applications.transfer.v1.MsgTransfer'"
					>
						<div>
							{{
								tx.body.messages[0].sender == bankAddress
									? '-' + tx.body.messages[0].token?.amount + ' ' + tx.body.messages[0].token?.denom.toUpperCase()
									: '+' + tx.body.messages[0].token?.amount + ' ' + tx.body.messages[0].token?.denom.toUpperCase()
							}}
						</div>
					</td>
					<td
						class="sp-transfer-list__table__amount"
						v-else-if="tx.body.messages[0]['@type'] == '/ibc.core.channel.v1.MsgRecvPacket'"
					>
						<div>
							{{
								getDecoded(tx.body.messages[0].packet?.data ?? '').receiver == bankAddress
									? '+' +
									  getDecoded(tx.body.messages[0].packet?.data ?? '').amount +
									  ' IBC/' +
									  tx.body.messages[0].packet?.destination_port.toUpperCase() +
									  '/' +
									  tx.body.messages[0].packet?.destination_channel.toUpperCase() +
									  '/' +
									  getDecoded(tx.body.messages[0].packet?.data ?? '')?.denom?.toUpperCase()
									: '-' +
									  getDecoded(tx.body.messages[0].packet?.data ?? '').amount +
									  ' IBC/' +
									  tx.body.messages[0].packet?.destination_port.toUpperCase() +
									  '/' +
									  tx.body.messages[0].packet?.destination_channel.toUpperCase() +
									  '/' +
									  getDecoded(tx.body.messages[0].packet?.data ?? '')?.denom?.toUpperCase()
							}}
						</div>
					</td>
					<td class="sp-transfer-list__table__amount" v-else></td>
				</tr>
			</tbody>
		</table>

		<table class="sp-transfer-list__table sp-box sp-shadow" v-else>
			<tbody>
				<tr>
					<td class="sp-transfer-list__status">
						<div class="sp-transfer-list__status__wrapper">
							<div class="sp-transfer-list__status__icon sp-transfer-list__status__icon__empty">
								<span class="sp-icon sp-icon-Transactions" />
							</div>
							<div class="sp-transfer-list__status__action">
								<div class="sp-transfer-list__status__action__text">No transactions yet</div>
								<div class="sp-transfer-list__status__action__date" v-if="!address">
									Add or unlock a wallet to see recent transactions
								</div>
							</div>
						</div>
					</td>
					<td class="sp-transfer-list__table__address"></td>
					<td class="sp-transfer-list__table__amount"></td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import dayjs from 'dayjs'
import { decode } from 'js-base64'
import { Transactions, Transaction, TxDecodedPacket } from '../../utils/interfaces'

export interface SpTransferListState {
	bankAddress: string
}
export default defineComponent({
	name: 'SpTransferList',
	props: { address: String, refresh: Boolean },
	data: function (): SpTransferListState {
		return {
			bankAddress: '',
		} as SpTransferListState
	},
	computed: {
		depsLoaded: function (): boolean {
			return this._depsLoaded
		},
		sentTransactions: function (): Transactions {
			return this.$store.getters['common/transfers/getGetTxsEvent']({
				event: 'transfer.sender%3D%27' + this.bankAddress + '%27',
			})
		},
		receivedTransactions: function (): Transactions {
			return this.$store.getters['common/transfers/getGetTxsEvent']({
				event: 'transfer.recipient%3D%27' + this.bankAddress + '%27',
			})
		},
		transactions: function (): Array<Transaction> {
			const sent: Array<Transaction> =
				this.sentTransactions.txs?.map((tx: Transaction, index: number) => {
					tx.response = this.sentTransactions.tx_responses[index]
					return tx
				}) ?? []
			const received: Array<Transaction> =
				this.receivedTransactions.txs?.map((tx: Transaction, index: number) => {
					tx.response = this.receivedTransactions.tx_responses[index]
					return tx
				}) ?? []
			return [...sent, ...received].sort((a: Transaction, b: Transaction) => b.response.height - a.response.height)
		},
	},
	beforeCreate: function (): void {
		const vuexModule = ['common', 'transfers']
		for (let i = 1; i <= vuexModule.length; i++) {
			const submod = vuexModule.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module `common.transfers` has not been registered!')
				this._depsLoaded = false
				break
			}
		}
	},
	created: async function (): Promise<void> {
		if (this._depsLoaded) {
			this.bankAddress = this.address ?? ''
			if (this.bankAddress != '') {
				await this.$store.dispatch('common/transfers/ServiceGetTxsEvent', {
					subscribe: true,
					event: 'transfer.sender%3D%27' + this.bankAddress + '%27',
				})
				await this.$store.dispatch('common/transfers/ServiceGetTxsEvent', {
					subscribe: true,
					event: 'transfer.recipient%3D%27' + this.bankAddress + '%27',
				})
			}
		}
	},
	methods: {
		getAmounts: function (tx: Transaction) {
			return tx.body.messages[0]?.amount ?? []
		},
		getFmtTime: function (time: string | undefined): string {
			const momentTime = dayjs(time)
			return momentTime.format('D MMM, YYYY')
		},
		getDecoded: function (packet: string): TxDecodedPacket {
			try {
				return JSON.parse(decode(packet))
			} catch (e) {
				return {}
			}
		},
		getTxText: function (tx: Transaction): string {
			let text = ''
			if (tx.response.code != 0) {
				text = '(Failed) '
			}
			if (tx?.body.messages.length > 1) {
				text = text + 'Multiple messages'
			} else {
				if (
					tx.body.messages[0]['@type'] == '/cosmos.bank.v1beta1.MsgSend' ||
					tx.body.messages[0]['@type'] == '/ibc.applications.transfer.v1.MsgTransfer'
				) {
					if (tx.body.messages[0].from_address == this.bankAddress) {
						text = text + 'Sent to'
					}
					if (tx.body.messages[0].to_address == this.bankAddress) {
						text = text + 'Received from'
					}
					if (tx.body.messages[0].sender == this.bankAddress) {
						text = text + 'IBC Sent to'
					}
				} else {
					let packet: TxDecodedPacket = { sender: '', receiver: '' }
					switch (tx.body.messages[0]['@type']) {
						case '/ibc.core.channel.v1.MsgChannelOpenAck':
							text = text + 'IBC Channel Open Ack'
							break
						case '/ibc.core.channel.v1.MsgChannelOpenConfirm':
							text = text + 'IBC Channel Open Confirm'
							break
						case '/ibc.core.channel.v1.MsgChannelOpenTry':
							text = text + 'IBC Channel Open Try'
							break
						case '/ibc.core.channel.v1.MsgRecvPacket':
							packet = this.getDecoded(tx.body.messages[0].packet?.data ?? '')

							if (packet.receiver == this.bankAddress) {
								text = text + 'IBC Received from'
							} else {
								text = text + 'IBC Recv Packet'
							}

							break
						case '/ibc.core.channel.v1.MsgAcknowledgement':
							text = text + 'IBC Ack Packet'
							break
						case '/ibc.core.channel.v1.MsgTimeout':
							text = text + 'IBC Timeout Packet'
							break
						case '/ibc.core.channel.v1.MsgChannelOpenInit':
							text = text + 'IBC Channel Open Init'
							break
						case '/ibc.core.client.v1.MsgCreateClient':
							text = text + 'IBC Client Create'
							break
						case '/ibc.core.client.v1.MsgUpdateClient':
							text = text + 'IBC Client Update'
							break
						case '/ibc.core.connection.v1.MsgConnectionOpenAck':
							text = text + 'IBC Connection Open Ack'
							break
						case '/ibc.core.connection.v1.MsgConnectionOpenInit':
							text = text + 'IBC Connection Open Init'
							break
						case '/ibc.core.connection.v1.MsgConnectionOpenConfirm':
							text = text + 'IBC Connection Open Confirm'
							break
						case '/ibc.core.connection.v1.MsgConnectionOpenTry':
							text = text + 'IBC Connection Open Try'
							break
						default:
							text = text + 'Message'
							break
					}
				}
			}
			return text
		},
		getTxDetails: function (tx: Transaction): string {
			let text = ''
			if (tx.body.messages.length > 1) {
				text = text + '-'
			} else {
				if (
					tx.body.messages[0]['@type'] == '/cosmos.bank.v1beta1.MsgSend' ||
					tx.body.messages[0]['@type'] == '/ibc.applications.transfer.v1.MsgTransfer'
				) {
					if (tx.body.messages[0].from_address == this.bankAddress) {
						text = text + tx.body.messages[0].to_address
					}
					if (tx.body.messages[0].to_address == this.bankAddress) {
						text = text + tx.body.messages[0].from_address
					}
					if (tx.body.messages[0].sender == this.bankAddress) {
						const chain = this.$store.getters['common/relayers/chainFromChannel'](tx.body.messages[0].source_channel)
						text = text + chain + ':' + tx.body.messages[0].receiver
					}
					if (tx.body.messages[0].receiver == this.bankAddress) {
						const chain = this.$store.getters['common/relayers/chainToChannel'](tx.body.messages[0].source_channel)
						text = text + chain + ':' + tx.body.messages[0].receiver
					}
				} else {
					let packet
					switch (tx.body.messages[0]['@type']) {
						case '/ibc.core.channel.v1.MsgChannelOpenAck':
							text = text + tx.body.messages[0].port_id + ' / ' + tx.body.messages[0].channel_id
							break
						case '/ibc.core.channel.v1.MsgChannelOpenConfirm':
							text = text + tx.body.messages[0].port_id + ' / ' + tx.body.messages[0].channel_id
							break
						case '/ibc.core.channel.v1.MsgChannelOpenTry':
							text =
								text +
								tx.body.messages[0].port_id +
								' / ' +
								tx.body.messages[0].previous_channel_id +
								' / ' +
								tx.body.messages[0].counterparty_version
							break
						case '/ibc.core.channel.v1.MsgRecvPacket':
							packet = this.getDecoded(tx.body.messages[0].packet?.data ?? '')
							if (packet.sender == this.bankAddress) {
								text = text + 'IBC:' + packet.receiver
							} else {
								if (packet.receiver == this.bankAddress) {
									text = text + 'IBC:' + packet.sender
								} else {
									text = text + 'IBC Recv Packet'
								}
							}
							break
						case '/ibc.core.channel.v1.MsgAcknowledgement':
							text =
								text +
								tx.body.messages[0].packet?.source_port +
								':' +
								tx.body.messages[0].packet?.source_channel +
								' <-> ' +
								tx.body.messages[0].packet?.destination_port +
								':' +
								tx.body.messages[0].packet?.destination_channel
							break
						case '/ibc.core.channel.v1.MsgTimeout':
							text = text + 'IBC Timeout Packet'
							break
						case '/ibc.core.channel.v1.MsgChannelOpenInit':
							text = text + tx.body.messages[0].port_id
							break
						case '/ibc.core.client.v1.MsgCreateClient':
							text = text + tx.body.messages[0].signer
							break
						case '/ibc.core.client.v1.MsgUpdateClient':
							text = text + tx.body.messages[0].client_id
							break
						case '/ibc.core.connection.v1.MsgConnectionOpenAck':
							text = text + tx.body.messages[0].connection_id + ' / ' + tx.body.messages[0].counterparty_connection_id
							break
						case '/ibc.core.connection.v1.MsgConnectionOpenInit':
							text = text + tx.body.messages[0].client_id
							break
						case '/ibc.core.connection.v1.MsgConnectionOpenConfirm':
							text = text + tx.body.messages[0].connection_id
							break
						case '/ibc.core.connection.v1.MsgConnectionOpenTry':
							text = text + tx.body.messages[0].client_id + ' / ' + tx.body.messages[0].previous_connection_id
							break
						default:
							text = text + 'Message'
							break
					}
				}
			}
			return text
		},
	},
	watch: {
		address: function (newAddr, oldAddr): void {
			if (newAddr != oldAddr && this._depsLoaded) {
				this.bankAddress = newAddr
				if (this.bankAddress != '') {
					this.$store.dispatch('common/transfers/ServiceGetTxsEvent', {
						subscribe: true,
						event: 'transfer.sender%3D%27' + this.bankAddress + '%27',
					})
					this.$store.dispatch('common/transfers/ServiceGetTxsEvent', {
						subscribe: true,
						event: 'transfer.recipient%3D%27' + this.bankAddress + '%27',
					})
				}
			}
		},
	},
})
</script>
