<template>
	<div class="SpBlockHeight" v-if="depsLoaded">
		Block Height: <strong>{{ blockHeight }}</strong>
	</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { Block } from '../../utils/interfaces'

export default defineComponent({
	name: 'SpBlockHeight',
	computed: {
		blocks: function (): Array<Block> {
			if (this._depsLoaded) {
				return this.$store.getters['common/blocks/getBlocks'](10)
			} else {
				return []
			}
		},
		blockHeight: function (): number | 'N/A' {
			if (this.blocks.length > 0) {
				return this.blocks[0].height
			} else {
				return 'N/A'
			}
		},
		depsLoaded: function (): boolean {
			return this._depsLoaded
		},
	},
	beforeCreate: function (): void {
		const vuexModule = ['common', 'blocks']
		for (let i = 1; i <= vuexModule.length; i++) {
			const submod = vuexModule.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module `common.blocks` has not been registered!')
				this._depsLoaded = false
				break
			}
		}
	},
})
</script>
