<template>
	<div class="sp-component sp-latestblocks" v-if="depsLoaded">
		<div class="sp-box sp-shadow sp-latestblocks__main" ref="blockList">
			<h2>LATEST BLOCKS</h2>
			<div v-if="blocks.length >= 10" class="sp-latestblocks__main__list">
				<SpBlockDisplaySmall
					v-for="block in blocks"
					:id="'block-' + block.height"
					:key="block.hash"
					:block="block"
					tsFormat="MMM D YYYY, HH:mm:ss"
				>
				</SpBlockDisplaySmall>
			</div>
			<div v-else class="sp-latestblocks__main__empty">
				<p>Generating blocks</p>
			</div>
			<SpButton type="primary" link="/blocks">View all blocks</SpButton>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SpBlockDisplaySmall from '../SpBlockDisplaySmall'
import SpButton from '../SpButton'

export default defineComponent({
	name: 'SpLatestBlocks',
	components: {
		SpBlockDisplaySmall,
		SpButton,
	},
	computed: {
		blocks: function (): Array<unknown> {
			if (this._depsLoaded) {
				return this.$store.getters['common/blocks/getBlocks'](10)
			} else {
				return []
			}
		},
		depsLoaded: function (): boolean {
			return this._depsLoaded
		},
	},
	beforeCreate: function (): void {
		const module = ['common', 'blocks']
		for (let i = 1; i <= module.length; i++) {
			let submod = module.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module `common.blocks` has not been registered!')
				this._depsLoaded = false
				break
			}
		}
	},
	watch: {
		blocks: function (): void {
			let initialPos = window.scrollY
			this.$nextTick(() => {
				window.scrollTo(0, initialPos)
			})
		},
	},
})
</script>
