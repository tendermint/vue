module.exports = {
	root: true,

	env: {
		node: true,
	},

	parserOptions: {
		parser: '@typescript-eslint/parser',
	},

	plugins: ['prettier'],

	rules: {
		'no-console': 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'vue/component-name-in-template-casing': ['error', 'PascalCase'],
	},

	extends: [
		'plugin:vue/vue3-essential',
		'eslint:recommended',
		'@vue/typescript/recommended',
		'@vue/prettier',
		'@vue/prettier/@typescript-eslint',
	],
}
