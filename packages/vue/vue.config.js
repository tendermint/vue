// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')

//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
	configureWebpack: {
		externals: {
			'element-ui': {
				commonjs: 'element-ui',
				commonjs2: 'element-ui',
				root: 'ELEMENT',
				amd: 'element-ui',
			},
			vue: {
				commonjs: 'vue',
				commonjs2: 'vue',
				root: 'Vue',
				amd: 'vue',
			},
			axios: {
				commonjs: 'axios',
				commonjs2: 'axios',
				root: 'axios',
				amd: 'axios',
			},
			moment: {
				commonjs: 'moment',
				commonjs2: 'moment',
				root: 'moment',
				amd: 'moment',
			},
		},
		entry: {
			main: './src/index.ts',
		},
		plugins: [
			new webpack.IgnorePlugin(/^\.\/wordlists\/(?!english)/),
			//	,new BundleAnalyzerPlugin()
		],
		stats: {
			logging: 'verbose',
			modules: true,
			moduleTrace: true,
			moduleAssets: true,
			children: true,
			providedExports: true,
			source: true,
			reasons: true,
		},
	},
}
