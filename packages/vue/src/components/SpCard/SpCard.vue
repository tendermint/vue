<template>
	<router-link class="sp-card" :class="'sp-card-' + type" v-if="link" :to="link">
		<div class="sp-card__icon">
			<span class="sp-icon" :class="'sp-icon-' + icon" />
		</div>
		<div class="sp-card__text">
			<slot></slot>
		</div>
	</router-link>
	<button class="sp-card" :class="'sp-card-' + type" v-else>
		<div class="sp-card__icon">
			<span class="sp-icon" :class="'sp-icon-' + icon" />
		</div>
		<div class="sp-card__text">
			<slot></slot>
		</div>
	</button>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
export default defineComponent({
	name: 'SpCard',
	props: {
		type: {
			type: String as PropType<string>,
			required: true,
		},
		icon: {
			type: String as PropType<string>,
			reequired: true,
		},
		link: {
			type: String as PropType<string>,
		},
	},
})
</script>
