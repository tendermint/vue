<template>
	<div
		class="sp-wallet-menu sp-rounded sp-shadow"
		:class="{ 'sp-opened': opened }"
		v-if="depsLoaded && !unlocking"
		v-click-outside="
			() => {
				opened = false
			}
		"
	>
		<div class="sp-wallet-menu__toggle" v-on:click="opened = !opened">
			<span class="sp-icon" :class="{ 'sp-icon-DownCaret': !opened, 'sp-icon-UpCaret': opened }" />
		</div>
		<div class="sp-wallet-menu-items">
			<template v-if="topWallet">
				<div
					class="sp-wallet-menu-item"
					:class="{
						'sp-wallet-menu-item__locked': topWallet.name != walletName,
					}"
					v-on:click="opened = !opened"
				>
					<div class="sp-wallet-menu-item__avatar" v-html="getAvatar(topWallet.name)"></div>
					<div class="sp-wallet-menu-item__avatar-shadow" v-html="getAvatar(topWallet.name)"></div>
					<div class="sp-wallet-menu-item__info">
						<span class="sp-text sp-bold sp-active">{{ topWallet.name }}</span>
						<br />
						<span class="sp-text" v-if="topWallet.name == walletName" :alt="currentAccount" :title="currentAccount">
							{{ shortAddress }}
						</span>
						<span class="sp-text" v-else> Locked </span>
					</div>
					<div class="sp-wallet-menu-item__status">
						<span
							class="sp-icon"
							:class="{
								'sp-icon-Unlock': topWallet.name == walletName,
								'sp-icon-Lock': topWallet.name != walletName,
							}"
							v-if="opened"
							v-on:click="toggleWallet(topWallet.name)"
						/>
					</div>
				</div>
			</template>
			<template v-if="topWallet.name == walletName">
				<div class="sp-wallet-menu__accounts">
					<SpAccountList />
				</div>
			</template>
			<div
				class="sp-wallet-menu-item"
				:class="{ 'sp-wallet-menu-item__locked': wallet.name != walletName }"
				v-for="(wallet, index) in restWallets"
				v-bind:key="wallet.name"
				v-on:click="toggleWallet(wallet.name)"
			>
				<div class="sp-wallet-menu-item__avatar" v-html="getAvatar(wallet.name)"></div>
				<div class="sp-wallet-menu-item__avatar-shadow" v-html="getAvatar(wallet.name)"></div>
				<div class="sp-wallet-menu-item__info">
					<span class="sp-text sp-bold" :class="{ 'sp-active': !topWallet && index == 0 }">{{ wallet.name }}</span>
					<br />
					<span class="sp-text" v-if="wallet.name == walletName">
						{{ currentAccount }}
					</span>
					<span class="sp-text" v-else> Locked </span>
				</div>
				<div class="sp-wallet-menu-item__status">
					<span
						class="sp-icon"
						:class="{
							'sp-icon-Unlock': wallet.name == walletName,
							'sp-icon-Lock': wallet.name != walletName,
						}"
						v-if="topWallet || index > 0 || opened"
						v-on:click="toggleWallet(wallet.name)"
					/>
				</div>
			</div>
			<div class="sp-dash"></div>
			<!--
			<div class="sp-wallet-menu-action">
				<div class="sp-wallet-menu-action__icon">
					<span class="sp-icon sp-icon-Settings" />
				</div>
				<div class="sp-wallet-menu-action__text sp-text">Manage Wallets</div>
			</div>
			//-->
			<div class="sp-wallet-menu-action">
				<SpLinkIcon icon="AddNew" text="Add New Wallet" v-on:click="createNewWallet" />
			</div>
		</div>
	</div>
	<div class="sp-wallet-menu sp-rounded sp-opened" v-else-if="depsLoaded && unlocking">
		<div class="sp-wallet-menu__toggle" v-on:click=";(unlocking = false), (toUnlock = null)">
			<span
				class="sp-icon"
				:class="{
					'sp-icon-DownCaret': !unlocking,
					'sp-icon-Close': unlocking,
				}"
			/>
		</div>
		<div class="sp-wallet-menu-items">
			<div class="sp-wallet-menu-item">
				<div class="sp-wallet-menu-item__avatar" v-html="getAvatar(walletToUnlock?.name ?? '')"></div>
				<div class="sp-wallet-menu-item__avatar-shadow" v-html="getAvatar(walletToUnlock?.name ?? '')"></div>
				<div class="sp-wallet-menu-item__info">
					<span class="sp-text sp-bold sp-active">{{ walletToUnlock?.name }}</span>
					<br />
					<span class="sp-text"> Locked </span>
				</div>
			</div>
		</div>
		<div class="sp-wallet-menu-unlock">
			<div class="sp-wallet-menu-unlock__title sp-header-text">Unlock Wallet</div>
			<div class="sp-wallet-menu-unlock__text">
				Enter your Wallet password below to unlock and access your addresses.
			</div>
			<div class="sp-wallet-menu-unlock__form">
				<div class="sp-form-group">
					<input class="sp-input" v-model="password" type="password" name="password" placeholder="Password" />
				</div>

				<SpButton v-on:click="unlockStoreWallet" type="primary">Unlock Wallet</SpButton>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
//import * as bip39 from 'bip39'
import SpAccountList from '../SpAccountList'
import SpButton from '../SpButton'
import SpLinkIcon from '../SpLinkIcon'
import avatar from 'gradient-avatar'
import type { Wallet } from '../../utils/interfaces'
import MD5 from 'crypto-js/md5'

export interface SpWalletMenuState {
	opened: boolean
	unlocking: boolean
	toUnlock: string | null
	password: string
}
export default defineComponent({
	name: 'SpWalletMenu',
	components: {
		SpAccountList,
		SpButton,
		SpLinkIcon,
	},
	emits: ['createNew'],
	data: function (): SpWalletMenuState {
		return {
			opened: false,
			unlocking: false,
			toUnlock: null,
			password: '',
		}
	},
	computed: {
		walletList: function (): Array<Wallet> {
			if (this._depsLoaded) {
				return this.$store.state.common.wallet.wallets
			} else {
				return []
			}
		},
		walletToUnlock: function (): Wallet | undefined {
			return this.walletList.find((x) => x.name == this.toUnlock)
		},
		shortAddress: function (): string | null {
			if (this.currentAccount) {
				return this.currentAccount.substr(0, 10) + '...' + this.currentAccount.slice(-5)
			} else {
				return null
			}
		},
		currentAccount: function (): string | null {
			if (this._depsLoaded) {
				if (this.loggedIn) {
					return this.$store.getters['common/wallet/address']
				} else {
					return null
				}
			} else {
				return null
			}
		},
		walletName: function (): string {
			if (this._depsLoaded) {
				return this.$store.getters['common/wallet/walletName']
			} else {
				return ''
			}
		},
		loggedIn: function (): boolean {
			if (this._depsLoaded) {
				return this.$store.getters['common/wallet/loggedIn']
			} else {
				return false
			}
		},
		lastWallet: function (): string | null {
			if (this._depsLoaded) {
				return this.$store.getters['common/wallet/lastWallet']
			} else {
				return null
			}
		},
		topWallet: function (): Wallet {
			return this.walletList.filter((x) => x.name == this.lastWallet)[0]
		},
		restWallets: function (): Array<Wallet> {
			return this.walletList.filter((x) => x.name != this.lastWallet)
		},
		depsLoaded: function (): boolean {
			return this._depsLoaded
		},
	},
	beforeCreate: function (): void {
		const vuexModule = ['common', 'wallet']
		for (let i = 1; i <= vuexModule.length; i++) {
			const submod = vuexModule.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module ' + vuexModule + ' has not been registered!')
				this._depsLoaded = false
				break
			}
		}
	},
	methods: {
		getAvatar: function (name: string): string {
			return avatar(MD5(name) + '', 64)
		},
		unlockStoreWallet: async function (): Promise<void> {
			if (this._depsLoaded) {
				await this.$store.dispatch('common/wallet/unlockWallet', {
					name: this.walletToUnlock?.name,
					password: this.password,
				})
				this.unlocking = false
			}
		},
		createNewWallet: function (): void {
			this.$emit('createNew')
		},
		toggleWallet: async function (name: string): Promise<void> {
			if (name != this.walletName) {
				if (name == 'Keplr Integration') {
					await window.keplr.enable(this.$store.getters['common/env/chainId'])
					await this.$store.dispatch('common/wallet/unlockWallet', {
						name,
						password: null,
					})
				} else {
					this.toUnlock = name
					this.unlocking = true
				}
			} else {
				await this.$store.dispatch('common/wallet/signOut')
				this.toUnlock = ''
				this.unlocking = false
			}
		},
	},
})
</script>
