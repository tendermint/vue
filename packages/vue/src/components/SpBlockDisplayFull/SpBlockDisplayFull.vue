<template>
	<div class="container">
		<div class="sp-component">
			<div class="sp-box sp-shadow sp-blockdisplayfull">
				<h2>Block: {{ block.height }}</h2>
				<h3>{{ block.hash }}</h3>
				<h4>{{ block.timestamp }}</h4>
				<h3>Transactions: {{ block.txDecoded.length }}</h3>
				<div
					class="sp-box sp-shadow sp-blockdisplayfull__transaction"
					v-for="tx in block.txDecoded"
					v-bind:key="tx.txHash"
				>
					<pre>{{ tx }}</pre>
					<div class="sp-blockdisplayfull__transaction__hash">
						{{ tx.txHash }}
					</div>
					<div class="sp-blockdisplayfull__transaction__messages">
						<div
							class="sp-blockdisplayfull__transaction__messages__message"
							v-for="(message, index) in tx.body.messages"
							v-bind:key="tx.txHash + '_' + index"
						>
							<pre>{{ message }}</pre>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
	name: 'SpBlockDisplayFull',
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
