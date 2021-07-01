<template>
	<div contenteditable v-on:keyup="keyUp" v-on:blur="blur" v-on:paste="paste" v-on:delete="del"></div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'

export interface SpKeyAreaState {
	rawContent?: string
	delayTimer: number | null
}

export default defineComponent({
	name: 'SpKeyArea',
	props: {
		value: {
			type: String as PropType<string>,
		},
	},
	data: function (): SpKeyAreaState {
		return {
			rawContent: this.value,
			delayTimer: null,
		}
	},
	methods: {
		validateInput: function (el: HTMLElement): void {
			this.rawContent = el.innerText
		},
		keyUp: function (event: KeyboardEvent): void {
			if (event.keyCode == 32) {
				this.validateInput(event.target as HTMLElement)
			}
		},
		blur: function (event: MouseEvent): void {
			this.validateInput(event.target as HTMLElement)
		},
		paste: function (event: KeyboardEvent): void {
			this.validateInput(event.target as HTMLElement)
		},
		del: function (event: KeyboardEvent): void {
			this.validateInput(event.target as HTMLElement)
		},
	},
})
</script>
