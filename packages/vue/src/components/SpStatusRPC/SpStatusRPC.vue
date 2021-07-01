<template>
	<div class="sp-status-rpc">
		<SpStatusLED :status="nodeStatus" :alt="'RPCTendermint RPC' + rpcNode" :title="'Tendermint RPC ' + rpcNode" />
		<div
			class="sp-status-rpc__text"
			v-if="showText"
			:alt="'Tendermint RPC ' + rpcNode"
			:title="'Tendermint RPC ' + rpcNode"
		>
			Tendermint RPC
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import SpStatusLED from '../SpStatusLED'

export default defineComponent({
	name: 'SpStatusRPC',
	components: {
		SpStatusLED,
	},
	props: {
		showText: {
			type: Boolean as PropType<boolean>,
		},
	},
	computed: {
		rpcNode: function (): string {
			return this.$store.getters['common/env/apiTendermint']
		},
		nodeStatus: function (): boolean {
			return this.$store.getters['common/env/rpcConnected']
		},
	},
})
</script>
