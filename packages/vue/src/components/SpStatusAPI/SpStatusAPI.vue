<template>
	<div class="sp-status-api">
		<SpStatusLED :status="nodeStatus" :alt="'Cosmos SDK API ' + apiNode" :title="'Cosmos SDK API ' + apiNode" />
		<div
			class="sp-status-api__text"
			v-if="showText"
			:alt="'Cosmos SDK API ' + apiNode"
			:title="'Cosmos SDK API ' + apiNode"
		>
			Cosmos SDK API
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import SpStatusLED from '../SpStatusLED'

export default defineComponent({
	name: 'SpStatusAPI',
	components: {
		SpStatusLED,
	},
	props: {
		showText: {
			type: Boolean as PropType<boolean>,
		},
	},
	computed: {
		apiNode: function (): string {
			return this.$store.getters['common/env/apiCosmos']
		},
		nodeStatus: function (): boolean {
			return this.$store.getters['common/env/apiConnected']
		},
	},
})
</script>
