import { mount } from '@vue/test-utils'
import { store } from '../store'

import SplWalletCreate from '@/components/SpWalletCreate'

const mountWrapper = () =>
	mount(SplWalletCreate, {
		global: {
			components: {
				// Mock vue-router injected components
				RouterLink: (h) => h('a')
			},
			plugins: [store]
		}
	})

test('should render properly', async () => {
	const wrapper = mountWrapper()

	expect(wrapper.text()).toContain('Create new wallet')
	expect(wrapper.text()).toContain('Import existing wallet')
})

test('should create new wallet', async () => {
	const wrapper = mountWrapper()
	const createButton = wrapper.findAll('.sp-wallet-create__cards > button')[0]

	expect(createButton.text()).toBe('Create new wallet')

	await createButton.trigger('click')

	expect(wrapper.text()).toContain(
		'Generate your own unique wallet. Receive a public address (0x...)'
	)
})
