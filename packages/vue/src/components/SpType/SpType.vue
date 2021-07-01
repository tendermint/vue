<template>
	<div>
		<div class="sp-type">
			<div class="sp-type__header sp-component-title">
				<h3>Custom type</h3>
				<span>|</span>
				<span>Create and edit a custom type form.</span>
			</div>

			<div class="sp-type__holder">
				<div class="sp-type-form__holder">
					<SpTypeForm
						:modulePath="modulePath"
						:moduleType="moduleType"
						action="create"
						class="sp-type__create sp-shadow"
					/>
				</div>
				<SpTypeList :modulePath="modulePath" :moduleType="moduleType" class="sp-type__list" />
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import SpTypeList from '../SpTypeList'
import SpTypeForm from '../SpTypeForm'
export default defineComponent({
	name: 'SpType',
	components: {
		SpTypeList,
		SpTypeForm,
	},
	props: {
		modulePath: {
			type: String as PropType<string>,
			default: '',
			required: true,
		},
		moduleType: {
			type: String as PropType<string>,
			default: '',
			required: true,
		},
	},
})
</script>
