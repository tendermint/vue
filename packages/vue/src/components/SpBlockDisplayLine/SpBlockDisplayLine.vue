<template>
	<tr class="sp-blockdisplayline">
		<td class="sp-blockdisplayline__height">
			<router-link :to="'/block/' + block.height" class="sp-blockdisplayline__height__link"
				>{{ block.height }}
			</router-link>
		</td>
		<td class="sp-blockdisplayline__hash">
			{{ block.hash }}
		</td>
		<td class="sp-blockdisplayline__timestamp">
			{{ formatTS(block.timestamp) }}
		</td>
		<td class="sp-blockdisplayline__txs">
			{{ block.details.num_txs }}
		</td>
	</tr>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
	name: 'SpBlockDisplayLine',
	props: {
		block: {
			type: Object as PropType<unknown>,
		},
		tsFormat: {
			type: String as PropType<string>,
		},
	},
	methods: {
		formatTS(timestamp: number): string {
			const momentTime = dayjs(timestamp)
			return momentTime.format(this.tsFormat)
		},
	},
})
</script>
