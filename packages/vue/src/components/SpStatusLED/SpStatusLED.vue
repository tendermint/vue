<template>
	<div class="sp-status-led" :class="{ 'sp-active': status }">
		<!-- <span class="sp-icon sp-icon-Status" /> -->
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
export default defineComponent({
	name: 'SpStatusLED',
	props: {
		status: {
			type: Boolean as PropType<boolean>,
		},
	},
})
</script>
