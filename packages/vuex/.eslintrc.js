module.exports = {
	root: true,
	env: {
		node: true,
		browser: true,
		es6: true 
	},
	plugins: ['prettier'],
	extends: [
		'eslint:recommended',
		"plugin:prettier/recommended",
	],
	
		parser: 'babel-eslint',
	
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
	}
}
