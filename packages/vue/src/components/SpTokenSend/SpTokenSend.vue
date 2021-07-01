<template>
	<div v-if="depsLoaded">
		<div class="sp-token-send__holder">
			<div class="sp-component sp-token-send">
				<div class="sp-token-send__header sp-component-title">
					<h3>Send tokens</h3>
					<span>|</span>
					<span>Transfer one or multiple tokens</span>
				</div>
				<div class="sp-token-send__main sp-box sp-shadow">
					<form class="sp-token-send__main__form">
						<div class="sp-token-send__main__rcpt__header sp-box-header">SEND TO</div>
						<select name="channel" v-model="transfer.channel" v-if="availableChannels.length > 0">
							<option value="">This chain</option>
							<option
								v-for="channel in availableChannels"
								v-bind:key="channel.src.channelId"
								:value="channel.src.channelId"
							>
								{{ channel.chainIdB }}
							</option>
						</select>
						<div class="sp-token-send__main__rcpt__wrapper">
							<div class="sp-token-send__main__rcpt__icon">
								<span class="sp-icon sp-icon-UpArrow" />
							</div>
							<div class="sp-token-send__main__rcpt__input sp-form-group">
								<input
									class="sp-input"
									name="rcpt"
									v-model="transfer.recipient"
									placeholder="Recipient address..."
									:disabled="!address"
								/>
							</div>
							<div
								class="sp-token-send__main__rcpt__memo__btn"
								v-on:click="memoOpen = true"
								v-if="!memoOpen && address"
							>
								+Add memo
							</div>
						</div>
						<div class="sp-token-send__main__rcpt__memo__header sp-box-header" v-if="memoOpen">
							MEMO
							<span class="sp-icon sp-icon-Close" v-on:click="memoOpen = false"></span>
						</div>
						<div class="sp-token-send__main__rcpt__memo" v-if="memoOpen">
							<textarea class="sp-token-send__main__rcpt__memo__content sp-textarea" v-model="transfer.memo" />
						</div>
						<div class="sp-token-send__main__amt__header sp-box-header">AMOUNT</div>
						<div class="sp-token-send__main__amt__wrapper" v-if="balances.length > 0 && address">
							<SpAmountSelect
								v-for="(amount, index) in transfer.amount"
								:index="index"
								:last="transfer.amount.length == 1"
								v-model="transfer.amount[index]"
								:available="balances"
								:selected="selectedDenoms"
								v-bind:key="'amount' + index"
								v-on:self-remove="transfer.amount.splice(index, 1)"
							/>
							<div
								class="sp-token-send__main__amt__add"
								v-if="transfer.channel == '' && nextToAdd != null"
								v-on:click="addToken"
							>
								+ Add Token
							</div>
						</div>
						<div class="sp-token-send__main__amt__wrapper" v-if="!address">
							<div class="sp-amount-select sp-amount-select__dummy">
								<div class="sp-form-group">
									<div class="sp-amount-select__denom">
										<div class="sp-amount-select__denom__selected">
											<div class="sp-amount-select__denom__name">
												<div class="sp-denom-marker" style="background: #809cff" />
												<div class="sp-dummy-fill" />
											</div>
										</div>
									</div>
									<input class="sp-input sp-input-large" value="0" name="rcpt" disabled="true" />
								</div>
							</div>
						</div>

						<div
							class="sp-token-send__main__footer"
							:class="{ 'sp-token-send__main__footer__open': feesOpen }"
							v-if="address"
						>
							<div class="sp-token-send__main__fees__header sp-box-header">
								FEES <span class="sp-circle">?</span>
								<span v-if="feesOpen" v-on:click="feesOpen = false" class="sp-icon sp-icon-UpCaret"></span>
							</div>
							<div class="sp-token-send__main__fees__content">
								<template v-if="feesOpen">
									<div class="sp-token-send__main__amt__wrapper" v-if="balances.length > 0">
										<SpAmountSelect
											v-for="(amount, index) in transfer.fees"
											:index="index"
											:last="transfer.fees.length == 1"
											v-model="transfer.fees[index]"
											:available="balances"
											:selected="selectedFeeDenoms"
											v-bind:key="'fee' + index"
											v-on:self-remove="transfer.fees.splice(index, 1)"
										/>
										<div class="sp-token-send__main__amt__add" v-if="nextFeeToAdd != null" v-on:click="addFeeToken">
											+ Add Fee Token
										</div>
										<div class="sp-line"></div>
									</div>
								</template>
								<template v-else>
									<div class="sp-token-send__main__fees__small">
										<span v-for="(fee, index) in transfer.fees" v-bind:key="'fee_small' + index">
											<strong>{{ fee.amount }}</strong>

											<template v-if="fee.denom.indexOf('ibc/') == 0">
												IBC/{{ denomTraces[fee.denom.split('/')[1]]?.denom_trace.path.toUpperCase() ?? '' }}/{{
													denomTraces[fee.denom.split('/')[1]]?.denom_trace.base_denom.toUpperCase() ?? 'UNKNOWN'
												}},
											</template>
											<template v-else> {{ fee.denom.toUpperCase() }}, </template>
										</span>
										<span v-on:click="feesOpen = true" class="sp-icon sp-icon-DownCaret"></span>
									</div>
								</template>
							</div>
							<div class="sp-token-send__main__btns">
								<div class="sp-token-send__main__btns__reset__fees" v-on:click="resetFees" v-if="feesOpen">
									Reset Fees
								</div>
								<div class="sp-token-send__main__btns__tx">
									<div class="sp-token-send__main__btns__reset" v-on:click="resetTransaction">Reset</div>
									<SpButton v-on:click="sendTransaction" type="primary" :disabled="!validForm" :busy="inFlight"
										>Send transaction</SpButton
									>
								</div>
							</div>
						</div>
						<div class="sp-token-send__main__footer" v-else>
							<div class="sp-token-send__main__fees__header sp-box-message">Access a wallet to send transactions</div>
							<div class="sp-token-send__main__fees__content"></div>
							<div class="sp-token-send__main__btns">
								<div class="sp-token-send__main__btns__reset__fees" v-on:click="resetFees" v-if="feesOpen">
									Reset Fees
								</div>
								<div class="sp-token-send__main__btns__tx">
									<SpButton v-on:click="sendTransaction" type="primary" :disabled="!validForm"
										>Send transaction</SpButton
									>
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
			<div class="sp-component sp-assets__wrapper">
				<SpAssets :balances="balances" />
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import SpButton from '../SpButton'
import SpAssets from '../SpAssets'
import SpAmountSelect from '../SpAmountSelect'
import { Bech32 } from '@cosmjs/encoding'
import { Amount, DenomTraces, Relayer } from '../../utils/interfaces'

export interface TransferData {
	recipient: string
	channel: string
	amount: Array<Amount>
	memo: string
	fees: Array<Amount>
}

export interface SpTokenSendState {
	transfer: TransferData
	feesOpen: boolean
	memoOpen: boolean
	inFlight: boolean
	bankAddress: string
	staking: Record<string, unknown>
	denomTraces: DenomTraces
}

export default defineComponent({
	name: 'SpTokenSend',
	components: {
		SpButton,
		SpAmountSelect,
		SpAssets,
	},
	props: {
		address: {
			type: String as PropType<string>,
		},
		refresh: {
			type: Boolean as PropType<boolean>,
		},
	},
	data: function (): SpTokenSendState {
		return {
			transfer: {
				recipient: '',
				channel: '',
				amount: [],
				memo: '',
				fees: [],
			} as TransferData,
			feesOpen: false,
			memoOpen: false,
			inFlight: false,
			bankAddress: '',
			staking: {},
			denomTraces: {} as DenomTraces,
		}
	},
	beforeCreate: function (): void {
		const vuexModule = ['cosmos.bank.v1beta1']
		for (let i = 1; i <= vuexModule.length; i++) {
			const submod = vuexModule.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module `cosmos.cosmos-sdk.bank` has not been registered!')
				this._depsLoaded = false
				break
			}
		}
	},
	mounted: function (): void {
		this.bankAddress = this.address ?? ''
		this.staking = this.$store.getters['cosmos.staking.v1beta1/getParams']()
		if (this._depsLoaded) {
			if (this.bankAddress != '') {
				this.$store.dispatch('cosmos.bank.v1beta1/QueryAllBalances', {
					params: { address: this.address },
					options: { all: true, subscribe: this.refresh },
				})
			}
		}
	},
	watch: {
		balances: function (newBal: Array<Amount>, oldBal: Array<Amount>): void {
			if (newBal != oldBal && newBal[0]?.denom && oldBal.length == 0) {
				this.transfer.amount = [{ amount: '', denom: newBal[0].denom }]
				this.transfer.fees = [{ amount: '', denom: newBal[0].denom }]
			}
		},
		address: function (newAddr: string, oldAddr: string): void {
			if (this._depsLoaded) {
				if (newAddr != oldAddr) {
					this.bankAddress = newAddr
					if (this.bankAddress != '') {
						this.$store.dispatch('cosmos.bank.v1beta1/QueryAllBalances', {
							params: { address: this.bankAddress },
							options: { subscribe: this.refresh },
						})
					}
				}
			}
		},
	},
	computed: {
		validForm: function (): boolean {
			if (
				this.transfer.amount.every(
					(x) => !isNaN(this.parseAmount(x.amount)) && x.amount != '' && this.parseAmount(x.amount) != 0,
				) &&
				this.transfer.fees.every((x) => !isNaN(this.parseAmount(x.amount))) &&
				this.validAddress &&
				this.address
			) {
				return true
			} else {
				return false
			}
		},
		balances: function (): Array<Amount> {
			if (this._depsLoaded) {
				return (
					this.$store.getters['cosmos.bank.v1beta1/getAllBalances']({
						params: { address: this.bankAddress },
					})?.balances ?? []
				)
			} else {
				return []
			}
		},
		nextToAdd: function (): Amount | null {
			const i = this.balances.findIndex((x) => !this.selectedDenoms.includes(x.denom))
			if (i == -1) {
				return null
			} else {
				return this.balances[i]
			}
		},
		nextFeeToAdd: function (): Amount | null {
			const i = this.balances.findIndex((x) => !this.selectedFeeDenoms.includes(x.denom))
			if (i == -1) {
				return null
			} else {
				return this.balances[i]
			}
		},
		selectedDenoms: function (): Array<string> {
			return this.transfer.amount.map((x) => x.denom)
		},
		selectedFeeDenoms: function (): Array<string> {
			return this.transfer.fees.map((x) => x.denom)
		},
		fullBalances: function (): Array<Amount> {
			return this.balances.map((x) => {
				this.addMapping(x)
				return x
			})
		},
		relayers: function (): Array<Relayer> {
			return this.$store.hasModule(['common', 'relayers']) ? this.$store.getters['common/relayers/getRelayers'] : []
		},
		availableChannels: function (): Array<Relayer> {
			return this.relayers?.filter((x) => x.status == 'connected') ?? []
		},
		depsLoaded: function (): boolean {
			return this._depsLoaded
		},
		validAddress: function (): boolean {
			let toAddress
			try {
				toAddress = !!Bech32.decode(this.transfer.recipient)
			} catch {
				toAddress = false
			}
			return toAddress
		},
	},
	methods: {
		parseAmount(amount: string): number {
			return amount == '' ? 0 : parseInt(amount)
		},
		addMapping: async function (balance: Amount): Promise<void> {
			if (balance.denom.indexOf('ibc/') == 0) {
				const denom = balance.denom.split('/')
				const hash = denom[1]
				this.denomTraces[hash] = await this.$store.dispatch('ibc.applications.transfer.v1/QueryDenomTrace', {
					options: { subscribe: false, all: false },
					params: { hash },
				})
			}
		},
		resetTransaction: function (): void {
			this.transfer.amount = [{ amount: '', denom: this.balances[0].denom }]
			this.transfer.recipient = ''
			this.transfer.memo = ''
			this.transfer.channel = ''
			this.transfer.fees = [{ amount: '', denom: this.balances[0].denom }]
			this.feesOpen = false
			this.memoOpen = false
		},
		resetFees: function (): void {
			this.transfer.fees = [{ amount: '', denom: this.balances[0].denom }]
		},
		addToken: function (): void {
			this.transfer.amount.push({
				amount: '',
				denom: this.nextToAdd?.denom ?? '',
			})
		},
		addFeeToken: function (): void {
			this.transfer.fees.push({
				amount: '',
				denom: this.nextFeeToAdd?.denom ?? '',
			})
		},
		sendTransaction: async function (): Promise<void> {
			if (this._depsLoaded && this.address) {
				if (this.validForm && !this.inFlight) {
					if (this.transfer.channel == '') {
						const value = {
							amount: this.transfer.amount,
							toAddress: this.transfer.recipient,
							fromAddress: this.bankAddress,
						}

						this.inFlight = true
						this.transfer.fees.forEach((x) => {
							if (x.amount == '') {
								x.amount = '0'
							}
						})
						try {
							const txResult = await this.$store.dispatch('cosmos.bank.v1beta1/sendMsgSend', {
								value,
								fee: this.transfer.fees,
								memo: this.transfer.memo,
							})
							if (txResult && !txResult.code) {
								this.resetTransaction()
							}
						} catch (e) {
							console.error(e)
						} finally {
							this.inFlight = false
						}
						await this.$store.dispatch('cosmos.bank.v1beta1/QueryAllBalances', {
							params: { address: this.address },
							options: { all: true, subscribe: false },
						})
					} else {
						try {
							const txResult = await this.$store.dispatch('ibc.applications.transfer.v1/sendMsgTransfer', {
								value: {
									sourcePort: 'transfer',
									sourceChannel: this.transfer.channel,
									sender: this.bankAddress,
									receiver: this.transfer.recipient,
									timeoutTimestamp: new Date().getTime() + 60000 + '000000',
									token: this.transfer.amount[0],
								},
								fee: this.transfer.fees,
								memo: this.transfer.memo,
							})
							if (txResult && !txResult.code) {
								this.resetTransaction()
							}
						} catch (e) {
							console.error(e)
						} finally {
							this.inFlight = false
						}
						await this.$store.dispatch('cosmos.bank.v1beta1/QueryAllBalances', {
							params: { address: this.address },
							options: { all: true, subscribe: false },
						})
					}
				}
			}
		},
	},
})
</script>
