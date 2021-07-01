<template>
	<div class="sp-type-form sp-box" :class="typeClass" v-if="depsLoaded">
		<form class="sp-type-form__main__form" v-if="action == 'create'">
			<div class="sp-type-form__header sp-box-header">CREATE NEW {{ moduleType.toUpperCase() }}</div>
			<div class="sp-type-form__field sp-form-group" v-for="field in createFieldList" v-bind:key="field.name">
				<input
					type="text"
					class="sp-input"
					:placeholder="capitalize(field.name)"
					:disabled="!address"
					v-model="typeData[field.name]"
					v-if="field.type == 'string'"
				/>
				<input
					type="number"
					class="sp-input"
					:placeholder="capitalize(field.name)"
					:disabled="!address"
					v-model="typeData[field.name]"
					v-if="field.type == 'number'"
				/>
			</div>
			<div class="sp-type-form__btns">
				<div class="sp-type-form__message" v-if="!address">Accesss a wallet to create a {{ moduleType }}</div>
				<SpButton type="primary" v-on:click="createType" :disabled="!address" :busy="inFlight"
					>Create {{ moduleType }}</SpButton
				>
			</div>
		</form>
		<form class="sp-type-form__main__form" v-if="action == 'update'">
			<div class="sp-type-form__header sp-box-header">UPDATE {{ moduleType.toUpperCase() }}</div>
			<div class="sp-type-form__field sp-form-group" v-for="field in updateFieldList" v-bind:key="field.name">
				<input
					type="text"
					class="sp-input"
					:placeholder="capitalize(field.name)"
					:disabled="!address"
					v-model="typeData[field.name]"
					v-if="field.type == 'string'"
					v-bind:readonly="id != '' && field.name == 'id'"
				/>
				<input
					type="number"
					class="sp-input"
					:placeholder="capitalize(field.name)"
					:disabled="!address"
					v-model="typeData[field.name]"
					v-if="field.type == 'number'"
				/>
			</div>
			<div class="sp-type-form__btns">
				<div class="sp-type-form__btns__reset" v-on:click="$emit('cancel-update')">Cancel</div>
				<SpButton type="primary" v-on:click="updateType()" :disabled="!address" :busy="inFlight"
					>Update {{ moduleType }}</SpButton
				>
			</div>
		</form>
		<form class="sp-type-form__main__form" v-if="action == 'delete'">
			<div class="sp-type-form__header sp-box-header">DELETE {{ moduleType.toUpperCase() }}</div>
			<div class="sp-type-form__field sp-form-group" v-for="field in deleteFieldList" v-bind:key="field.name">
				<input
					type="text"
					class="sp-input"
					:placeholder="capitalize(field.name)"
					:disabled="!address"
					v-model="typeData[field.name]"
					v-if="field.type == 'string'"
					v-bind:readonly="id != '' && field.name == 'id'"
				/>
				<input
					type="number"
					class="sp-input"
					:placeholder="capitalize(field.name)"
					:disabled="!address"
					v-model="typeData[field.name]"
					v-if="field.type == 'number'"
				/>
			</div>
			<div class="sp-type-form__btns">
				<div class="sp-type-form__btns__reset" v-on:click="$emit('cancel-delete')">Cancel</div>
				<SpButton type="primary" v-on:click="deleteType()" :disabled="!address" :busy="inFlight"
					>Delete {{ moduleType }}</SpButton
				>
			</div>
		</form>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { SpTypeObject, Field } from '../../utils/interfaces'

export interface SpTypeFormState {
	fieldList: Array<Field>
	typeData: SpTypeObject
	inFlight: boolean
}
export default defineComponent({
	name: 'SpTypeForm',
	components: {},
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
		action: {
			type: String as PropType<string>,
			default: '',
			required: true,
		},
		id: {
			type: String as PropType<string>,
			default: '',
		},
	},
	data: function () {
		return {
			fieldList: [],
			typeData: {} as SpTypeObject,
			inFlight: false,
		} as SpTypeFormState
	},
	emits: ['created', 'updated', 'deleted'],
	watch: {
		id: async function (newId): Promise<void> {
			this.typeData['id'] = newId
			if (this._depsLoaded) {
				if (this.typeData['id'] != '') {
					await this.$store.dispatch(this.modulePath + '/Query' + this.moduleType, {
						options: { subscribe: true },
						params: { id: this.typeData['id'] },
					})
					const data = this.$store.getters[this.modulePath + '/get' + this.moduleType]({
						params: { id: this.typeData['id'] },
					})
					this.typeData = data[this.capitalize(this.moduleType)]
				}
			}
		},
	},
	computed: {
		address: function (): string {
			return this.$store.getters['common/wallet/address']
		},
		typeClass: function (): string {
			return 'sp-type-form-' + this.moduleType
		},
		createFieldList: function (): Array<Field> {
			return this.fieldList.filter((x) => x.name != 'creator' && x.name != 'id')
		},
		updateFieldList: function (): Array<Field> {
			return this.fieldList.filter((x) => x.name != 'creator')
		},
		deleteFieldList: function (): Array<Field> {
			return this.fieldList.filter((x) => x.name == 'id')
		},
		selectedAccount: function (): string | null {
			if (this._depsLoaded) {
				return this.$store.getters['common/wallet/address']
			} else {
				return null
			}
		},
		createTypeData: function (): SpTypeObject {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, ...rest } = this.typeData
			return rest
		},
		updateTypeData: function (): SpTypeObject {
			return this.typeData
		},
		deleteTypeData: function (): SpTypeObject {
			// eslint-disable-next-line no-unused-vars
			const { id, creator } = this.typeData
			return { id, creator }
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
			for (const field of this.fieldList) {
				this.typeData[field.name] = ''
			}
			this.typeData['id'] = this.id
			if (this.typeData['id'] != '') {
				await this.$store.dispatch(this.modulePath + '/Query' + this.moduleType, {
					options: { subscribe: true },
					params: { id: this.typeData['id'] },
				})
				const data = this.$store.getters[this.modulePath + '/get' + this.moduleType]({
					params: { id: this.typeData['id'] },
				})
				this.typeData = data[this.capitalize(this.moduleType)]
			}
		}
	},
	methods: {
		capitalize: function (str: string): string {
			return str.charAt(0).toUpperCase() + str.slice(1)
		},
		resetForm: function (): void {
			for (const i in this.typeData) {
				this.typeData[i] = ''
			}
		},
		createType: async function (): Promise<void> {
			if (this._depsLoaded && this.address) {
				this.typeData['creator'] = this.selectedAccount ?? ''
				this.inFlight = true
				try {
					await this.$store.dispatch(this.modulePath + '/sendMsgCreate' + this.moduleType, {
						value: { ...this.createTypeData },
						fee: [],
					})
					this.inFlight = false
					this.$emit('created')
					this.resetForm()
				} catch (e) {
					console.error(e)
				} finally {
					this.inFlight = false
				}
			}
		},
		updateType: async function (): Promise<void> {
			if (this._depsLoaded) {
				this.typeData['creator'] = this.selectedAccount ?? ''
				this.inFlight = true
				try {
					await this.$store.dispatch(this.modulePath + '/sendMsgUpdate' + this.moduleType, {
						value: { ...this.updateTypeData },
						fee: [],
					})
					this.inFlight = false
					this.$emit('updated')
					this.resetForm()
				} catch (e) {
					console.error(e)
				} finally {
					this.inFlight = false
				}
			}
		},
		deleteType: async function (): Promise<void> {
			if (this._depsLoaded) {
				this.typeData['creator'] = this.selectedAccount ?? ''
				this.inFlight = true
				try {
					await this.$store.dispatch(this.modulePath + '/sendMsgDelete' + this.moduleType, {
						value: { ...this.deleteTypeData },
						fee: [],
					})
					this.inFlight = false
					this.$emit('deleted')
					this.resetForm()
				} catch (e) {
					console.error(e)
				} finally {
					this.inFlight = false
				}
			}
		},
	},
})
</script>
