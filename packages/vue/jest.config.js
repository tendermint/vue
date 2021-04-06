module.exports = {
	moduleFileExtensions: ['js', 'vue'],
	modulePaths: ['<rootDir>/src', '<rootDir>/node_modules'],
	transform: {
		'^.+\\.js$': '<rootDir>/node_modules/babel-jest',
		'.*\\.(vue)$': '<rootDir>/node_modules/vue-jest'
	},
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1'
	}
}
