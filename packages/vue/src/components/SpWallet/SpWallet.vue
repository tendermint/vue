<template>
	<div class="sp-wallet" v-if="depsLoaded">
		<SpWalletMenu v-if="walletList.length > 0 && !create" v-on:createNew="create = true" />
		<SpButton v-else-if="walletList.length == 0 && !create" v-on:click="create = true">Access wallet</SpButton>
		<SpWalletCreate title="Access wallet" v-else v-on:close="create = false">
			Create or import an existing wallet to manage your DeFi portfolio.
		</SpWalletCreate>
	</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import SpWalletMenu from '../SpWalletMenu'
import SpButton from '../SpButton'
import SpWalletCreate from '../SpWalletCreate'
import type { Wallet } from '../../utils/interfaces'
export interface SpWalletState {
	create: boolean
}
export default defineComponent({
	name: 'SpWallet',
	components: {
		SpWalletMenu,
		SpButton,
		SpWalletCreate,
	},
	data: function (): SpWalletState {
		return {
			create: false,
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
})
</script>
