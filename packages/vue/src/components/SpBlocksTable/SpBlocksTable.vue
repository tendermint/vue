<template>
	<table class="sp-blockstable">
		<thead>
			<tr>
				<th class="sp-blockstable__height"><strong>HEIGHT</strong></th>
				<th class="sp-blockstable__hash"><strong>HASH</strong></th>
				<th class="sp-blockstable__timestamp"><strong>TIME</strong></th>
				<th class="sp-blockstable__txs"><strong>TXs</strong></th>
			</tr>
		</thead>
		<tbody>
			<SpBlockDisplayLine
				:block="block"
				tsFormat="YYYY-MM-DD HH:mm:ss"
				v-for="block in blocks"
				v-bind:key="block.hash"
			/>
		</tbody>
	</table>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import SpBlockDisplayLine from '../SpBlockDisplayLine'

export default defineComponent({
	name: 'SpBlocksTable',
	components: {
		SpBlockDisplayLine,
	},
	props: {
		blocks: {
			type: Object as PropType<Array<unknown>>,
		},
	},
})
</script>
