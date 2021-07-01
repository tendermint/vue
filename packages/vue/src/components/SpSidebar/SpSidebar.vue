<template>
	<div class="sp-sidebar" :class="{ 'sp-opened': opened, 'sp-mob-opened': mobOpened }">
		<div class="sp-hamburger sp-shadow" v-on:click="toggleMobOpen">
			<div class="sp-icon sp-icon-Hamburger"></div>
		</div>
		<div class="sp-sidebar__header" v-if="$slots.header">
			<slot name="header"></slot>
		</div>
		<div class="sp-sidebar__content">
			<slot></slot>
		</div>
		<div class="sp-sidebar__footer">
			<slot name="footer"></slot>
		</div>
		<!--
			<SpBadgeButton
			:icon="opened ? 'LeftCaret' : 'RightCaret'"
			v-on:click="toggleOpen"
			class="sp-sidebar__back"
		/>
		//-->
	</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
//import SpBadgeButton from '../SpBadgeButton'
export interface SpSidebarState {
	opened: boolean
	mobOpened: boolean
}
export default defineComponent({
	name: 'SpSidebar',
	components: {
		//	SpBadgeButton
	},
	data: function (): SpSidebarState {
		return {
			opened: true,
			mobOpened: false,
		} as SpSidebarState
	},
	emits: ['sidebar-open', 'sidebar-close'],
	methods: {
		toggleOpen: function (): void {
			this.opened = !this.opened
			this.opened ? this.$emit('sidebar-open') : this.$emit('sidebar-close')
		},
		toggleMobOpen: function (): void {
			this.mobOpened = !this.mobOpened
			//this.mobOpened ? this.$emit('sidebar-open') : this.$emit('sidebar-close')
		},
	},
})
</script>
