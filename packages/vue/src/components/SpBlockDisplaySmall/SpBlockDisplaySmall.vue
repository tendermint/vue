<template>
	<router-link class="sp-box sp-blockdisplaysmall sp-shadow" :to="'/block/' + block.height">
		<div class="sp-blockdisplaysmall__height">
			<h2>{{ block.height }}</h2>
		</div>
		<div class="sp-blockdisplaysmall__hash">
			{{ block.hash }}
		</div>
		<div class="sp-blockdisplaysmall__timestamp">
			{{ formatTS(block.timestamp) }}
		</div>
		<div class="sp-blockdisplaysmall__txs">
			No of Txs: <strong>{{ block.details.data.txs.length }}</strong>
		</div>
	</router-link>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
	name: 'SpBlockDisplaySmall',
	props: {
		block: {
			type: Object as PropType<unknown>,
		},
		tsFormat: {
			type: String as PropType<string>,
		},
	},
	methods: {
		formatTS: function (timestamp: number): string {
			const momentTime = dayjs(timestamp)
			return momentTime.format(this.tsFormat)
		},
	},
})
</script>
