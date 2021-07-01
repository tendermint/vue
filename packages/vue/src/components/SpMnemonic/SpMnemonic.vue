<template>
	<div class="sp-mnemonic">
		<ul class="sp-mnemonic__list">
			<li class="sp-mnemonic__list__item" v-for="(word, index) in firstHalfWords" v-bind:key="'word' + index + 1">
				<span>{{ index + 1 }}</span> {{ word }}
			</li>
		</ul>
		<ul class="sp-mnemonic__list">
			<li
				class="sp-mnemonic__list__item"
				v-for="(word, index) in secondHalfWords"
				v-bind:key="'word' + index + 1 + firstHalfWords.length"
			>
				<span>{{ index + 1 + firstHalfWords.length }}</span> {{ word }}
			</li>
		</ul>
		<div class="sp-mnemonic__copy">
			<SpLinkIcon icon="Copy" text="Copy phrase" v-on:click="copyMnemonic" />
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import SpLinkIcon from '../SpLinkIcon'
import { copyToClipboard } from '../../utils/helpers'

export default defineComponent({
	name: 'SpMnemonic',
	props: {
		mnemonic: {
			type: String as PropType<string>,
			required: true,
		},
	},
	components: {
		SpLinkIcon,
	},
	computed: {
		words: function (): Array<string> {
			return this.mnemonic.split(' ')
		},
		firstHalfWords: function (): Array<string> {
			return this.words.slice(0, this.words.length / 2)
		},
		secondHalfWords: function (): Array<string> {
			return this.words.slice(this.words.length / 2)
		},
	},
	methods: {
		copyMnemonic: function (): void {
			copyToClipboard(this.mnemonic)
		},
	},
})
</script>
