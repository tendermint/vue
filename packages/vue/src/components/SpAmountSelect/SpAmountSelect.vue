<template>
	<div class="sp-amount-select">
		<div class="sp-amount-select__overlay" v-if="modalOpen" v-on:click="modalOpen = false"></div>
		<div class="sp-form-group" :class="{ 'sp-amount-select__overlay__open': modalOpen }">
			<div class="sp-amount-select__denom" :class="{ 'sp-focused': focused }">
				<div class="sp-amount-select__denom__selected" v-on:click="toggleModal">
					<div class="sp-amount-select__denom__name">
						<div
							class="sp-amount-select__denom__balance"
							:class="{
								'sp-amount-select__denom__balance__fail': parseAmount(fulldenom.amount) - parseAmount(amount) < 0,
							}"
						>
							<strong>Avail.</strong>
							{{ parseAmount(fulldenom.amount) - parseAmount(amount) }}/{{ fulldenom.amount }}
						</div>
						<div class="sp-denom-marker" :style="'background: #' + fulldenom.color" />
						<template v-if="fulldenom.denom.indexOf('ibc/') == 0">
							IBC/{{ denomTraces[fulldenom.denom.split('/')[1]]?.denom_trace.path.toUpperCase() ?? '' }}/{{
								denomTraces[fulldenom.denom.split('/')[1]]?.denom_trace.base_denom.toUpperCase() ?? 'UNKNOWN'
							}}
						</template>
						<template v-else>
							{{ fulldenom.denom.toUpperCase() }}
						</template>
					</div>
					<div class="sp-amount-select__denom__controls">
						<div class="sp-amount-select__denom__remove" v-if="modalOpen && !last" v-on:click="selfRemove">Remove</div>
						<span
							:class="{
								'sp-icon sp-icon-DownCaret': !modalOpen,
								'sp-icon sp-icon-UpCaret': modalOpen,
							}"
						/>
					</div>
				</div>
				<div class="sp-amount-select__denom__modal" v-if="modalOpen">
					<div class="sp-amount-select__denom__modal__search">
						<div class="sp-icon sp-icon-Search" />
						<input
							type="text"
							v-model="searchTerm"
							placeholder="Search..."
							class="sp-amount-select__denom__modal__search__input"
						/>
					</div>
					<div class="sp-line"></div>
					<div class="sp-amount-select__denom__modal__header">
						<div class="sp-amount-select__denom__modal__header__token">TOKEN</div>
						<div class="sp-amount-select__denom__modal__header__amount">AMOUNT</div>
					</div>
					<div
						class="sp-amount-select__denom__modal__item"
						:class="{
							'sp-amount-select__denom__modal__item__selected': avail.denom == fulldenom.denom,
							'sp-amount-select__denom__modal__item__disabled': enabledDenoms.findIndex((x) => x == avail) == -1,
						}"
						v-on:click="setDenom(avail)"
						v-for="avail in filteredDenoms"
						v-bind:key="'denom_' + avail.denom"
					>
						<div class="sp-amount-select__denom__name">
							<div class="sp-denom-marker" :style="'background: #' + avail.color" />

							<template v-if="avail.denom.indexOf('ibc/') == 0">
								IBC/{{ denomTraces[avail.denom.split('/')[1]]?.denom_trace.path.toUpperCase() ?? '' }}/{{
									denomTraces[avail.denom.split('/')[1]]?.denom_trace.base_denom.toUpperCase() ?? 'UNKNOWN'
								}}
							</template>
							<template v-else>
								{{ avail.denom.toUpperCase() }}
							</template>
						</div>
						<div class="sp-amount-select__denom__balance">
							{{ avail.amount }}
						</div>
					</div>
				</div>
			</div>
			<input
				class="sp-input sp-input-large"
				:class="{
					'sp-error': fulldenom.amount != '' && parseAmount(fulldenom.amount) - parseAmount(amount) < 0,
				}"
				name="rcpt"
				v-model="amount"
				placeholder="0"
				v-on:focus="focused = true"
				v-on:blur="focused = false"
			/>
		</div>
	</div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Amount, ColoredAmount, DenomTraces } from '../../utils/interfaces'
import { str2rgba } from '../../utils/helpers'

export interface SpAmountSelectState {
	amount: string
	denom: string | null
	focused: boolean
	modalOpen: boolean
	searchTerm: string
	denomTraces: DenomTraces
}

export default defineComponent({
	name: 'SpAmountSelect',
	data: function (): SpAmountSelectState {
		return {
			amount: '',
			denom: null,
			focused: false,
			modalOpen: false,
			searchTerm: '',
			denomTraces: {} as DenomTraces,
		}
	},
	props: {
		modelValue: {
			type: Object as PropType<Amount>,
		},
		available: {
			type: Array as PropType<Array<Amount>>,
		},
		index: { type: Number as PropType<number> },
		selected: {
			type: Array as PropType<Array<string>>,
		},
		last: {
			type: Boolean as PropType<boolean>,
		},
	},
	emits: ['update:modelValue', 'self-remove'],
	mounted: function () {
		this.amount = this.modelValue?.amount + '' ?? ''
		this.denom = this.modelValue?.denom ?? null
	},
	computed: {
		currentVal: function (): Amount {
			return { amount: this.amount, denom: this.denom ?? '' }
		},
		fulldenom: function (): ColoredAmount {
			return (
				this.denoms.find((x: ColoredAmount) => x.denom == this.denom) ?? {
					amount: '',
					denom: '',
					color: '',
				}
			)
		},
		enabledDenoms: function (): Array<Amount> {
			return (
				this.available?.filter(
					(x) =>
						this.selected?.findIndex((y) => y == x.denom) == -1 ||
						this.selected?.findIndex((y) => y == x.denom) == this.index,
				) ?? []
			)
		},
		denoms: function (): Array<ColoredAmount> {
			return (
				this.available?.map((x: Amount) => {
					this.addMapping(x)
					const y: ColoredAmount = { amount: '0', denom: '', color: '' }
					y.amount = x.amount
					y.denom = x.denom
					y.color = str2rgba(x.denom.toUpperCase())
					return x as ColoredAmount
				}) ?? []
			)
		},
		filteredDenoms: function (): Array<ColoredAmount> {
			return this.searchTerm == ''
				? this.denoms
				: this.denoms.filter((x) => x.denom.toUpperCase().indexOf(this.searchTerm.toUpperCase()) !== -1)
		},
	},
	methods: {
		toggleModal: function (): void {
			this.modalOpen = !this.modalOpen
		},
		selfRemove: function (): void {
			this.$emit('self-remove')
		},
		addMapping: async function (balance: Amount): Promise<void> {
			if (balance.denom.indexOf('ibc/') == 0) {
				const denom = balance.denom.split('/')
				const hash = denom[1]
				this.denomTraces[hash] = await this.$store.dispatch('ibc.applications.transfer.v1/QueryDenomTrace', {
					options: { subscribe: false, all: false },
					params: { hash },
				})
			}
		},
		setDenom: function (avail: Amount): void {
			if (this.enabledDenoms.findIndex((x) => x == avail) != -1) {
				this.denom = avail.denom
				this.modalOpen = false
			}
		},
		parseAmount: function (amount: string): number {
			return amount == '' ? 0 : parseInt(amount)
		},
	},
	watch: {
		modelValue: function (newVal: Amount): void {
			this.amount = newVal.amount
			this.denom = newVal.denom
		},
		amount: function (newVal: string, oldVal: string): void {
			if (newVal != oldVal) {
				this.$emit('update:modelValue', this.currentVal)
			}
		},
		denom: function (newVal: string, oldVal: string): void {
			if (newVal != oldVal) {
				this.$emit('update:modelValue', this.currentVal)
			}
		},
	},
})
</script>
