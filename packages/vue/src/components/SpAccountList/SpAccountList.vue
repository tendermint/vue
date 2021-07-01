<template>
	<div class="sp-accounts-list" v-if="depsLoaded">
		<div v-if="!newAccount.show">
			<ul v-if="accountList.length > 0" class="sp-accounts-list-items">
				<li v-for="account in accountList" v-bind:key="account.address" class="sp-accounts-list-item">
					<div class="sp-accounts-list-item__use">
						<div class="sp-accounts-list-item__path">
							{{ account.pathIncrement }}
						</div>
						<div
							class="sp-accounts-list-item__address"
							@click="useAccount(account.address)"
							:class="{ 'sp-active': account.address == currentAccount }"
						>
							{{ shortenAddress(account.address) }}
						</div>
						<div class="sp-accounts-list-item__copy" @click="copyAddress(account.address)">
							<span class="sp-icon sp-icon-Copy" />
						</div>
					</div>
				</li>
			</ul>
			<div class="sp-accounts-new" v-if="activeWallet.name != 'Keplr Integration' && activeWallet.password != null">
				<SpLinkIcon icon="AddNew" text="Generate new address" v-on:click="createAccount" />
			</div>
		</div>
		<div class="SpAccountForm SpForm" v-if="newAccount.show">
			<div class="SpFormTitle">
				<strong>ADD ACCOUNT:</strong>
			</div>
			<div class="SpAccountCheckbox SpCheckbox">
				<label for="SpAccountNextAvailable"
					>CREATE NEXT AVAILABLE ACCOUNT?

					<input type="checkbox" v-model="newAccount.nextAvailable" id="SpAccountNextAvailable"
				/></label>
			</div>
			<div class="SpAccountHDPath" v-if="!newAccount.nextAvailable">
				USE SPECIFIC HD PATH: <em>{{ HDPath }}</em
				><input type="number" v-model="newAccount.pathIncrement" class="SpInputNumber" />
			</div>
			<div class="SpAccountCreate">
				<button @click="createAccount()" class="SpButton">
					<div class="SpButtonText">CREATE ACCOUNT</div>
				</button>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import SpLinkIcon from '../SpLinkIcon'
import type { Wallet, Account } from '../../utils/interfaces'
import { copyToClipboard } from '../../utils/helpers'

export interface NewAccount {
	show: boolean
	nextAvailable: boolean
	pathIncrement: number | null
}
export interface SpAccountListState {
	newAccount: NewAccount
}
export default defineComponent({
	name: 'SpAccountList',
	data: function (): SpAccountListState {
		return {
			newAccount: {
				show: false,
				nextAvailable: true,
				pathIncrement: null,
			} as NewAccount,
		}
	},
	components: {
		SpLinkIcon,
	},
	emits: ['account-selected'],
	computed: {
		activeWallet: function (): Wallet {
			return this.$store.state.common.wallet.activeWallet
		},
		accountList: function (): Account[] {
			return this.$store.state.common.wallet.activeWallet.accounts
		},
		HDPath: function (): string {
			return this.$store.state.common.wallet.activeWallet.HDpath
		},
		depsLoaded: function (): boolean {
			return this._depsLoaded
		},
		currentAccount: function (): string | null {
			if (this._depsLoaded) {
				return this.$store.getters['common/wallet/address']
			} else {
				return null
			}
		},
	},
	beforeCreate: function () {
		const module = ['common', 'wallet']
		for (let i = 1; i <= module.length; i++) {
			const submod = module.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module `common.wallet` has not been registered!')
				this._depsLoaded = false
				break
			}
		}
	},
	methods: {
		copyAddress: function (address: string): void {
			copyToClipboard(address)
		},
		defaultState: function (): SpAccountListState {
			return {
				newAccount: {
					show: false,
					nextAvailable: true,
					pathIncrement: null,
				},
			}
		},
		reset: function (): void {
			Object.assign(this.$data, {
				newAccount: {
					show: false,
					nextAvailable: true,
					pathIncrement: null,
				},
			})
		},
		newAccountForm: function (): void {
			;(this.newAccount as NewAccount).show = true
		},
		shortenAddress: function (addr: string): string {
			return addr.substr(0, 10) + '...' + addr.slice(-5)
		},
		useAccount: async function (address: string): Promise<void> {
			if (this._depsLoaded) {
				await this.$store.dispatch('common/wallet/switchAccount', address)
				this.$emit('account-selected')
			}
		},
		createAccount: async function (): Promise<void> {
			if (this._depsLoaded) {
				if (this.newAccount.nextAvailable) {
					await this.$store.dispatch('common/wallet/addAccount')
				} else {
					await this.$store.dispatch('common/wallet/addAccount', this.newAccount.pathIncrement)
				}
			}
			this.reset()
		},
	},
})
</script>
