<template>
	<div class="sp-relayer" v-if="depsLoaded">
		<div class="sp-relayer__overlay" v-if="connecting" />
		<div class="sp-relayer__modal sp-box" v-if="connecting">
			<div class="sp-relayer__modal__header">Setting up relayer</div>
			<div class="sp-icon sp-icon-Reload" />
			{{ loadingLog }}
		</div>
		<div class="sp-relayer__basic">
			<div class="sp-relayer__details">
				<div class="sp-relayer__name">{{ relayer.name }}</div>
				<div class="sp-relayer__path">({{ relayer.chainIdA }} &lt;-&gt; {{ relayer.chainIdB }})</div>
				<div class="sp-relayer__status">{{ relayer.status.toUpperCase() }}</div>
			</div>
			<div class="sp-relayer__actions">
				<div class="sp-relayer__running" v-if="relayer.status == 'connected' && relayer.running">RUNNING</div>
				<div class="sp-relayer__stopped" v-if="relayer.status == 'connected' && !relayer.running">STOPPED</div>

				<SpButton v-on:click="linkRelayer" type="primary" v-if="relayer.status != 'connected'"
					>Connect relayer</SpButton
				>
				<SpButton v-on:click="stopRelayer" type="primary" v-if="relayer.status == 'connected' && relayer.running"
					>Stop relayer</SpButton
				>
				<SpButton v-on:click="startRelayer" type="primary" v-if="relayer.status == 'connected' && !relayer.running"
					>Start relayer</SpButton
				>
			</div>
		</div>
		<div class="sp-relayer__advanced">
			<div class="sp-relayer__advanced__header" v-if="relayer.status == 'created'">
				<div class="sp-relayer__advanced__header__message">
					In order to complete this relayer setup you must fund the address:
					<strong>{{ relayer.targetAddress }}</strong> at <strong>{{ relayer.chainIdB }}</strong
					>.<br />
					When the address is funded, click the "Connect relayer" button.
				</div>
			</div>
			<div class="sp-relayer__advanced__header" v-else>
				<div class="sp-relayer__advanced__header__title">Advanced</div>
				<div class="sp-line"></div>
				<div class="sp-relayer__advanced__header__icon" v-on:click="showAdvanced = !showAdvanced">
					<div
						class="sp-icon"
						:class="{
							'sp-icon-UpCaret': showAdvanced,
							'sp-icon-DownCaret': !showAdvanced,
						}"
					/>
				</div>
			</div>
			<div class="sp-relayer__advanced__contents" v-if="relayer.status != 'created' && showAdvanced">
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A ID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.chainIdA || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A Endpoint</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ homeEndpoint || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A Prefix</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ homePrefix || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A Gas Price</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ homeGasPrice || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B ID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.chainIdB || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B Endpoint</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.endpoint || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B Prefix</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.prefix || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B Gas Price</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.gasPrice || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A ClientID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.endA?.clientID || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A ConnectionID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.endA?.connectionID || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A PortID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.src?.portId || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A ChannelID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.src?.channelId || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B ClientID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.endB?.clientID || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B ConnectionID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.endB?.connectionID || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B PortID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.dest?.portId || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B ChannelID</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.dest?.channelId || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A Packet Height</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.heights?.packetHeightA || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain A Ack Height</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.heights?.ackHeightA || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B Packet Height</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.heights?.packetHeightB || '-' }}
					</div>
				</div>
				<div class="sp-relayer__advanced__contents__item">
					<div class="sp-relayer__advanced__contents__item__key">Chain B Ack Height</div>
					<div class="sp-relayer__advanced__contents__item__value">
						{{ relayer.heights?.ackHeightB || '-' }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import SpButton from '../SpButton'
import { Relayer } from '../../utils/interfaces'

export interface SpRelayerState {
	showAdvanced: boolean
	connecting: boolean
	extradots: string
}
export default defineComponent({
	name: 'SpRelayer',
	props: {
		relayer: {
			type: Object as PropType<Relayer>,
			required: true,
		},
	},
	components: {
		SpButton,
	},
	data() {
		return {
			showAdvanced: false,
			connecting: false,
			extradots: '',
		} as SpRelayerState
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
		homePrefix: function (): string {
			return this.$store.getters['common/env/addrPrefix']
		},
		homeGasPrice: function (): string {
			return this.$store.getters['common/wallet/gasPrice']
		},
		homeEndpoint: function (): string {
			return this.$store.getters['common/env/apiTendermint']
		},
		log: function (): string {
			return this.$store.getters['common/relayers/log']
		},
		loadingLog: function (): string {
			return this.log + this.extradots
		},
	},
	methods: {
		linkRelayer: async function (): Promise<void> {
			this.connecting = true
			const loading = setInterval(() => {
				this.extradots = this.extradots + '.'
				if (this.extradots == '......') {
					this.extradots = ''
				}
			}, 500)
			await this.$store.dispatch('common/relayers/linkRelayer', {
				name: this.relayer.name,
			})
			clearInterval(loading)
			this.connecting = false
		},
		startRelayer: async function (): Promise<void> {
			await this.$store.dispatch('common/relayers/runRelayer', this.relayer.name)
		},
		stopRelayer: async function (): Promise<void> {
			await this.$store.dispatch('common/relayers/stopRelayer', this.relayer.name)
		},
	},
})
</script>
