<template>
	<div class="sp-type-list" v-if="depsLoaded">
		<div class="sp-type-list__main sp-box sp-shadow">
			<div class="sp-type-list__header sp-box-header">
				{{ moduleType.toUpperCase() + 'S' }}
			</div>
			<div class="sp-type-list-empty" v-if="!typeItems || typeItems.length == 0">
				<div class="sp-type-list__item">
					<div class="sp-type-list__item__icon">
						<div class="sp-icon sp-icon-Docs" />
					</div>
					<div class="sp-type-list__item__details">
						<div class="sp-type-list__item__details__field">
							<strong>No posts yet </strong><br />
							Add a new post by using the form
						</div>
					</div>
				</div>
			</div>
			<template v-else>
				<div v-for="(item, index) in typeItems" v-bind:key="item.id">
					<div class="sp-dashed-line" v-if="index != 0" />
					<div class="sp-type-list__item">
						<div class="sp-type-list__item__icon">
							<div class="sp-icon sp-icon-Docs" />
						</div>
						<div class="sp-type-list__item__details">
							<div class="sp-type-list__item__details__field" v-for="field in fieldList" v-bind:key="field">
								<strong> {{ capitalize(field.name) }} </strong><br />
								{{ item[field.name] }}
							</div>
						</div>
						<div
							class="sp-type-list__item__more"
							:class="{ 'sp-type-list__item__more__open': moreOpen == index }"
							v-if="address"
						>
							<div class="sp-icon sp-icon-More" v-on:click="moreOpen = index" />
							<div class="sp-type-list__item__options sp-box" v-if="moreOpen == index">
								<div class="sp-type-list__item__options__edit" v-on:click=";(editID = item['id']), (editOpen = true)">
									Edit
								</div>
								<div
									class="sp-type-list__item__options__delete"
									v-on:click=";(deleteID = item['id']), (deleteOpen = true)"
								>
									Delete
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</div>
		<div
			class="sp-type-list__overlay"
			v-if="editOpen || deleteOpen"
			v-on:click=";(editOpen = false), (deleteOpen = false)"
		/>
		<div class="sp-type-list__edit__form" v-if="editID >= 0">
			<SpTypeForm
				:modulePath="modulePath"
				:moduleType="moduleType"
				:id="editID"
				action="update"
				v-on:cancel-update=";(editID = -1), (editOpen = false)"
				v-on:updated=";(editID = -1), (editOpen = false)"
			/>
		</div>
		<div class="sp-type-list__delete__form" v-if="deleteID >= 0">
			<SpTypeForm
				:modulePath="modulePath"
				:moduleType="moduleType"
				:id="deleteID"
				action="delete"
				v-on:cancel-delete=";(deleteID = -1), (deleteOpen = false)"
				v-on:deleted=";(deleteID = -1), (deleteOpen = false)"
			/>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { SpTypeObject, Field } from '../../utils/interfaces'

export interface SpTypeListState {
	fieldList: Array<Field>
	moreOpen: number
	editOpen: boolean
	deleteOpen: boolean
	editID: number
	deleteID: number
}
export default defineComponent({
	name: 'SpTypeList',
	props: {
		moduleType: {
			type: String as PropType<string>,
			default: '',
		},
		modulePath: {
			type: String as PropType<string>,
			default: '',
		},
	},
	data: function () {
		return {
			fieldList: [] as Array<Field>,
			moreOpen: -1,
			editOpen: false,
			deleteOpen: false,
			editID: -1,
			deleteID: -1,
		} as SpTypeListState
	},
	computed: {
		address: function (): string {
			return this.$store.getters['common/wallet/address']
		},
		typeItems: function (): Array<SpTypeObject> {
			if (this._depsLoaded) {
				const items = this.$store.getters[this.modulePath + '/get' + this.moduleType + 'All']()
				return items ? items[this.capitalize(this.moduleType)] : []
			} else {
				return []
			}
		},
		depsLoaded: function (): boolean {
			return this._depsLoaded
		},
	},
	beforeCreate: function (): void {
		const module = [...this.modulePath.split('/')]
		for (let i = 1; i <= module.length; i++) {
			const submod = module.slice(0, i)
			if (!this.$store.hasModule(submod)) {
				console.log('Module ' + this.modulePath + ' has not been registered!')
				this._depsLoaded = false
				break
			}
		}
	},
	created: async function (): Promise<void> {
		if (this._depsLoaded) {
			this.fieldList = this.$store.getters[this.modulePath + '/getTypeStructure'](this.moduleType)
			await this.$store.dispatch(this.modulePath + '/Query' + this.moduleType + 'All', { options: { subscribe: true } })
		}
	},
	methods: {
		capitalize: function (str: string): string {
			return str.charAt(0).toUpperCase() + str.slice(1)
		},
	},
})
</script>
