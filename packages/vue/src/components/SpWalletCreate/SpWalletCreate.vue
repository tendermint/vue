<template>
	<div class="sp-wallet-create sp-shadow">
		<div class="sp-wallet-create__close" v-if="!createform && !importform">
			<a class="sp-icon sp-icon-Close" v-on:click="close" />
		</div>
		<div class="sp-wallet-create__back" v-else>
			<a class="sp-icon sp-icon-Lock" v-on:click="goBack" v-if="create.step2" />
			<a class="sp-icon sp-icon-LeftArrow" v-on:click="goBack" v-if="!create.step2" />
		</div>
		<template v-if="!createform && !importform">
			<h3>{{ title }}</h3>
			<div class="sp-wallet-create__text">
				<slot></slot>
			</div>
			<div class="sp-wallet-create__cards">
				<SpCard type="primary" icon="Add" v-on:click="createform = true">Create new wallet</SpCard>
				<SpCard type="secondary" icon="Upload" v-on:click="importform = true">Import existing wallet</SpCard>
			</div>
			<div class="sp-wallet-create__keplr" v-if="keplrAvailable">
				<SpButton type="primary" v-on:click="useKeplr">Use Keplr</SpButton>
			</div>
		</template>
		<template v-if="createform && create.step1">
			<h3>Create wallet</h3>
			<div class="sp-wallet-create__text">
				Generate your own unique wallet. Receive a public address (0x...) and choose a method for access and recovery.
			</div>
			<div class="sp-wallet-create__form">
				<div class="sp-form-group">
					<input
						class="sp-input"
						:class="{ 'sp-error': !walletNameAvailable && !creating }"
						v-model="create.name"
						type="text"
						name="walletname"
						placeholder="Wallet name"
					/>
				</div>
				<div class="sp-error-message" v-if="!walletNameAvailable && !creating">
					A wallet by this name already exist. Please choose a different one.
				</div>
				<div class="sp-form-group">
					<input class="sp-input" v-model="create.password" name="password" type="password" placeholder="Password" />
					<input
						class="sp-input"
						v-model="create.confirm"
						name="confirm"
						type="password"
						placeholder="Confirm password"
					/>
				</div>
				<div class="sp-error-message" v-if="create.password != '' && create.password != create.confirm">
					Passwords do not match
				</div>
				<SpButton v-on:click="createStep2" type="primary">Create</SpButton>
			</div>
		</template>
		<template v-if="createform && create.step2">
			<h3>Here is your<br />recovery phrase</h3>
			<div class="sp-wallet-create__text">You can restore your wallet using your recovery phrase.</div>
			<div class="sp-wallet-create__text">
				Write it down on paper. Resist temptation to email it to yourself or sceenshot it.
			</div>
			<SpMnemonic :mnemonic="create.mnemonic" />
			<SpButton type="secondary" v-on:click="downloadBackup">Download Backup</SpButton>
			<SpButton type="primary" v-on:click="done">Done</SpButton>
		</template>
		<template v-if="importform && imported.step1">
			<h3>
				Import<br />
				existing wallet
			</h3>
			<div class="sp-wallet-create__text">Paste your recovery phrase or private key below to import your wallet.</div>
			<textarea class="sp-key-area sp-textarea" v-model="imported.mnemonicOrKey"></textarea>
			<!--
			<SpMnemonicInput
				class="sp-key-area sp-textarea"
				v-model="imported.mnemonicOrKey"
			></SpMnemonicInput>
			//-->
			<div class="sp-error-message" v-if="imported.mnemonicOrKey != '' && !validMnemonic">
				You have not entered a valid mnemonic or private key.
			</div>
			<SpButton type="primary" v-on:click="importStep2" :disabled="imported.mnemonicOrKey == '' || !validMnemonic"
				>Next</SpButton
			>
		</template>
		<template v-if="importform && imported.step2">
			<h3>Import existing wallet</h3>
			<div class="sp-wallet-create__text">Please name your wallet and choose a password</div>
			<div class="sp-wallet-create__form">
				<div class="sp-form-group">
					<input
						class="sp-input"
						:class="{ 'sp-error': !walletNameAvailable && !creating }"
						v-model="imported.name"
						type="text"
						name="walletname"
						placeholder="Wallet name"
					/>
				</div>
				<div class="sp-form-group">
					<input class="sp-input" v-model="imported.password" name="password" type="password" placeholder="Password" />
					<input
						class="sp-input"
						v-model="imported.confirm"
						name="confirm"
						type="password"
						placeholder="Confirm password"
					/>
				</div>
				<SpButton
					v-on:click="doneImport"
					:disabled="imported.name == '' || imported.password == '' || imported.password != imported.confirm"
					>Done</SpButton
				>
			</div>
		</template>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import * as bip39 from 'bip39'
import dayjs from 'dayjs'
import { saveAs } from 'file-saver'
import AES from 'crypto-js/aes'
import SpCard from '../SpCard'
import SpButton from '../SpButton'
import SpMnemonic from '../SpMnemonic'
import type { Wallet, Amount, AmountWithMeta } from '../../utils/interfaces'

//import SpMnemonicInput from '../SpMnemonicInput'
export interface SpCreateForm {
	step1: boolean
	step2: boolean
	name: string
	password: string
	confirm: string
	mnemonic: string
}
export interface SpImportForm {
	step1: boolean
	step2: boolean
	name: string
	password: string
	confirm: string
	mnemonicOrKey: string
}
export interface SpWalletCreateState {
	createform: boolean
	importform: boolean
	creating: boolean
	create: SpCreateForm
	imported: SpImportForm
}
export default defineComponent({
	name: 'SpWalletCreate',
	components: {
		SpCard,
		SpButton,
		SpMnemonic,
		//SpMnemonicInput
	},
	props: {
		title: {
			type: String as PropType<string>,
		},
	},
	data: function (): SpWalletCreateState {
		return this.defaultState()
	},
	emits: ['close'],
	computed: {
		keplrAvailable: function (): boolean {
			return window.keplr ? true : false
		},
		nameToCreate: function (): string {
			return this.createform ? this.create.name : this.imported.name
		},
		walletNameAvailable: function (): boolean {
			return this.$store.getters['common/wallet/nameAvailable'](this.nameToCreate)
		},
		wallet: function (): Wallet {
			return this.$store.getters['common/wallet/wallet']
		},
		validMnemonic: function (): boolean {
			return bip39.validateMnemonic(this.imported.mnemonicOrKey)
		},
	},
	methods: {
		downloadBackup: function (): void {
			const backup = AES.encrypt(JSON.stringify(this.wallet), this.wallet.password ?? '')

			const blob = new Blob([backup.toString()], {
				type: 'application/octet-stream; charset=us-ascii',
			})
			saveAs(blob, this.backupName())
		},
		backupName: function (): string {
			return this.wallet.name + '_Backup_' + dayjs().format('YYYY-MM-DD') + '.bin'
		},
		close: function (): void {
			this.$emit('close')
		},
		reset: function (): void {
			Object.assign(this.$data, this.defaultState())
		},
		goBack: function (): void {
			if (this.createform) {
				if (this.create.step1) {
					this.reset()
					return
				}
				if (this.create.step2) {
					this.create.step2 = false
					this.create.step1 = true
					return
				}
			}

			if (this.importform) {
				if (this.imported.step1) {
					this.reset()
					return
				}
				if (this.imported.step2) {
					this.imported.step2 = false
					this.imported.step1 = true
					return
				}
			}
		},
		defaultState: function (): SpWalletCreateState {
			return {
				createform: false,
				importform: false,
				creating: false,
				create: {
					step1: true,
					step2: false,
					name: '',
					password: '',
					confirm: '',
					mnemonic: '',
				},
				imported: {
					step1: true,
					step2: false,
					name: '',
					password: '',
					confirm: '',
					mnemonicOrKey: '',
				},
			}
		},
		generateMnemonic: function (): void {
			const mnemonic = bip39.generateMnemonic(256)
			this.create.mnemonic = mnemonic
		},
		createStep2: async function (): Promise<void> {
			this.creating = true
			if (this.walletNameAvailable) {
				this.create.step1 = false
				this.create.step2 = true
				this.generateMnemonic()
				await this.createWallet()
				this.creating = false
			}
			//this.downloadBackup()
		},
		importStep2: function (): void {
			this.imported.step1 = false
			this.imported.step2 = true
		},
		done: function (): void {
			this.reset()
			this.close()
		},
		doneImport: async function (): Promise<void> {
			this.creating = true
			if (this.walletNameAvailable) {
				await this.importWallet()
				this.creating = false
				this.reset()
				this.close()
			}
		},
		importWallet: async function (): Promise<void> {
			if (this._depsLoaded) {
				await this.$store.dispatch('common/wallet/createWalletWithMnemonic', {
					name: this.imported.name,
					mnemonic: this.imported.mnemonicOrKey,
					password: this.imported.password,
					prefix: this.$store.state.common.env.addrPrefix,
				})
				//this.reset()
			}
		},
		useKeplr: async function (): Promise<void> {
			if (this._depsLoaded) {
				const staking = this.$store.getters['cosmos.staking.v1beta1/getParams']()
				const tokens = this.$store.getters['cosmos.bank.v1beta1/getTotalSupply']()
				const chainId = this.$store.getters['common/env/chainId']

				try {
					await window.keplr.experimentalSuggestChain({
						chainId: chainId,
						chainName: this.$store.getters['common/env/chainName'],
						rpc: this.$store.getters['common/env/apiTendermint'],
						rest: this.$store.getters['common/env/apiCosmos'],
						stakeCurrency: {
							coinDenom: staking.params.bond_denom.toUpperCase(),
							coinMinimalDenom: staking.params.bond_denom,
							coinDecimals: 0,
						},
						bip44: {
							coinType: 118,
						},
						bech32Config: {
							bech32PrefixAccAddr: this.$store.getters['common/env/addrPrefix'],
							bech32PrefixAccPub: this.$store.getters['common/env/addrPrefix'] + 'pub',
							bech32PrefixValAddr: this.$store.getters['common/env/addrPrefix'] + 'valoper',
							bech32PrefixValPub: this.$store.getters['common/env/addrPrefix'] + 'valoperpub',
							bech32PrefixConsAddr: this.$store.getters['common/env/addrPrefix'] + 'valcons',
							bech32PrefixConsPub: this.$store.getters['common/env/addrPrefix'] + 'valconspub',
						},
						currencies: tokens.supply.map((x: Amount) => {
							const y: AmountWithMeta = {
								amount: '0',
								denom: '',
								coinDenom: '',
								coinMinimalDenom: '',
								coinDecimals: 0,
							}
							y.coinDenom = x.denom.toUpperCase()
							y.coinMinimalDenom = x.denom
							y.coinDecimals = 0
							return y
						}),
						feeCurrencies: tokens.supply.map((x: Amount) => {
							const y: AmountWithMeta = {
								amount: '0',
								denom: '',
								coinDenom: '',
								coinMinimalDenom: '',
								coinDecimals: 0,
							}
							y.coinDenom = x.denom.toUpperCase()
							y.coinMinimalDenom = x.denom
							y.coinDecimals = 0
							return y
						}),
						coinType: 118,
						gasPriceStep: {
							low: 0.01,
							average: 0.025,
							high: 0.04,
						},
					})
					await window.keplr.enable(chainId)
					const offlineSigner = window.getOfflineSigner(chainId)
					await this.$store.dispatch('common/wallet/connectWithKeplr', offlineSigner)
					this.done()
				} catch (e) {
					console.error(e)
				}
			}
		},
		createWallet: async function (): Promise<void> {
			if (this._depsLoaded) {
				await this.$store.dispatch('common/wallet/createWalletWithMnemonic', {
					name: this.create.name,
					mnemonic: this.create.mnemonic,
					password: this.create.password,
					prefix: this.$store.state.common.env.addrPrefix,
				})
				//this.reset()
			}
		},
	},
})
</script>
