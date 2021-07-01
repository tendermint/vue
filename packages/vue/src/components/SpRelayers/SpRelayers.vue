<template>
	<div v-if="depsLoaded">
		<div class="sp-relayers__holder">
			<div class="sp-component sp-relayers">
				<div class="sp-relayers__header sp-component-title">
					<h3>Relayer list</h3>
					<span>|</span>
					<span>Your configured relayers</span>
				</div>
				<div class="sp-relayers__main sp-box sp-shadow">
					<div class="sp-relayers__main__message" v-if="!address">Your configured relayers will appear here.</div>

					<div class="sp-relayer sp-relayer__dummy" v-if="!address">
						<div class="sp-relayer__basic">
							<div class="sp-relayer__details">
								<div class="sp-relayer__name">
									<div class="sp-dummy-fill" />
								</div>
								<div class="sp-relayer__path">
									<div class="sp-dummy-fill" />
								</div>
								<div class="sp-relayer__status">
									<div class="sp-dummy-fill" />
								</div>
							</div>
							<div class="sp-relayer__actions">
								<div class="sp-dummy-fill" />
							</div>
						</div>
					</div>
					<div class="sp-relayers__main__message" v-if="address && relayers.length == 0">
						You have no relayers configured on this address.
					</div>
					<div v-for="(relayer, index) in relayers" v-bind:key="relayer.name">
						<div class="sp-line" v-if="index > 0" />
						<SpRelayer :relayer="relayer" />
					</div>
				</div>
			</div>
			<div class="sp-component sp-relayers__add">
				<div class="sp-assets__header sp-component-title">
					<h3>Add a relayer</h3>
				</div>
				<template v-if="!address">
					<div class="sp-relayers__add__main sp-box sp-shadow">
						<div class="sp-relayers__add__main__message">Add or unlock a wallet to create a relayer.</div>
					</div>
				</template>
				<template v-else>
					<SpButton v-on:click="addHubRelayer" type="primary" v-if="!showRelayerForm && !hasHubRelayer"
						>Connect to Cosmos Hub</SpButton
					>
					<div class="sp-relayers__add__or" v-if="!showRelayerForm && !hasHubRelayer">- or -</div>
					<SpButton v-on:click="showRelayerForm = true" type="primary" v-if="!showRelayerForm && !hasHubRelayer"
						>Add custom relayer</SpButton
					>
					<div class="sp-relayers__add__main sp-box sp-shadow" v-if="showRelayerForm || hasHubRelayer">
						<form class="sp-relayers__add__form">
							<div class="sp-form-group">
								External
								<input type="checkbox" value="true" v-model="relayerForm.external" />
							</div>
							<template v-if="relayerForm.external">
								<div class="sp-form-group">
									<input class="sp-input" v-model="relayerForm.name" placeholder="Name (e.g. Foochain)" />
								</div>
								<div class="sp-form-group">
									<input class="sp-input" v-model="relayerForm.chainId" placeholder="Chain ID (e.g. foochain-2)" />
								</div>
								<div class="sp-form-group">
									<input class="sp-input" v-model="relayerForm.channelId" placeholder="Channel (e.g. channel-0)" />
								</div>
							</template>
							<template v-else>
								<div class="sp-form-group">
									<input class="sp-input" v-model="relayerForm.name" placeholder="Name (e.g. Foochain)" />
								</div>
								<div class="sp-form-group">
									<input
										class="sp-input"
										v-model="relayerForm.endpoint"
										placeholder="Endpoint (e.g. https://rpc.foochain.org)"
									/>
								</div>
								<div class="sp-form-group">
									<input class="sp-input" v-model="relayerForm.prefix" placeholder="Prefix (e.g. foo)" />
								</div>
								<div class="sp-form-group">
									<input class="sp-input" v-model="relayerForm.gasPrice" placeholder="Gas Price (e.g. 0.025ufoo)" />
								</div>
							</template>
							<div class="sp-relayers__add__btns">
								<SpButton v-on:click="showRelayerForm = false" type="secondary" v-if="!hasHubRelayer">Cancel</SpButton>
								<SpButton v-on:click="addRelayer" type="primary">Add Relayer</SpButton>
							</div>
						</form>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import SpRelayer from '../SpRelayer'
import { Relayer } from '../../utils/interfaces'

export interface RelayerForm {
	name: string
	endpoint: string
	gasPrice: string
	external: boolean
	chainId: string
	channelId: string
	prefix: string
}
export interface SpRelayersState {
	showRelayerForm: boolean
	relayerForm: RelayerForm
}
export default defineComponent({
	name: 'SpRelayers',
	components: {
		SpRelayer,
	},
	data: function (): SpRelayersState {
		return {
			showRelayerForm: false,
			relayerForm: {
				name: '',
				endpoint: '',
				prefix: '',
				gasPrice: '',
				external: false,
				chainId: '',
				channelId: '',
			} as RelayerForm,
		} as SpRelayersState
	},
	beforeCreate: function (): void {
		let vuexModule = ['common', 'wallet']
		for (let i = 1; i <= vuexModule.length; i++) {
			const submod = vuexModule.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module `common.wallet` has not been registered!')
				this._depsLoaded = false
				break
			}
		}
		vuexModule = ['common', 'relayers']
		for (let i = 1; i <= vuexModule.length; i++) {
			const submod = vuexModule.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module `common.relayers` has not been registered!')
				this._depsLoaded = false
				break
			}
		}
	},
	computed: {
		depsLoaded: function (): boolean {
			return this._depsLoaded
		},
		address: function (): string {
			return this.$store.getters['common/wallet/address']
		},
		hasHubRelayer: function (): boolean {
			return this.relayers.findIndex((x) => x.chainIdB == 'cosmoshub-4') > -1
		},
		relayers: function (): Array<Relayer> {
			return this.$store.getters['common/relayers/getRelayers']
		},
	},
	methods: {
		addRelayer: async function (): Promise<void> {
			await this.$store.dispatch('common/relayers/createRelayer', this.relayerForm)
			this.relayerForm = {
				name: '',
				chainId: '',
				channelId: '',
				external: false,
				endpoint: '',
				prefix: '',
				gasPrice: '',
			}
		},
		addHubRelayer: async function (): Promise<void> {
			await this.$store.dispatch('common/relayers/createRelayer', {
				name: 'CosmosHub',
				endpoint: 'https://rpc.nylira.net',
				prefix: 'cosmos',
				gasPrice: '0.025uatom',
			})
			this.relayerForm = {
				name: '',
				chainId: '',
				channelId: '',
				external: false,
				endpoint: '',
				prefix: '',
				gasPrice: '',
			}
		},
	},
})
</script>
