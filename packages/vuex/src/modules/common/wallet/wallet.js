import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing'

import { assertIsBroadcastTxSuccess } from '@cosmjs/stargate'
import { stringToPath } from '@cosmjs/crypto'
import CryptoJS from 'crypto-js'
import { keyFromWif, keyToWif } from '../../../helpers/keys'

/* START TODO: Integrate closure below for additional security 
function getDecryptor(password) {
	let secret = password
	return async function (encryptedMnemonic, HDpath) {
		const mnemonic = CryptoJS.AES.decrypt(encryptedMnemonic, secret).toString(
			CryptoJS.enc.Utf8
		)
		return await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, HDpath)
	}
}
END TODO */
export default {
	namespaced: true,
	state() {
		return {
			wallets: JSON.parse(window.localStorage.getItem('wallets')) || [],
			activeWallet: null,
			activeClient: null,
			selectedAddress: '',
			authorized: false,
			gasPrice: '0.0000025token',
		}
	},
	getters: {
		client: (state) => state.activeClient,
		gasPrice: (state) => state.gasPrice,
		wallet: (state) => state.activeWallet,
		address: (state) => state.selectedAddress,
		getMnemonic: (state) => state.activeWallet.mnemonic,
		getPath: (state) =>
			state.activeWallet?.HDpath +
			state.activeWallet?.accounts.find((x) => x.address == state.selectedAddress).pathIncrement,
		relayers: (state) => {
			return state.activeWallet?.accounts.find((x) => x.address == state.selectedAddress).relayers ?? []
		},
		nameAvailable: (state) => (name) => {
			return state.wallets.findIndex((x) => x.name == name) == -1
		},
		lastWallet: (state) => {
			if (state.activeWallet) {
				return state.activeWallet.name
			} else {
				return window.localStorage.getItem('lastWallet')
			}
		},
		loggedIn: (state) => state.activeClient !== null,
		signer: (state) => {
			if (state.activeClient) {
				return state.activeClient.signer
			} else {
				return null
			}
		},
		walletName: (state) => (state.activeWallet ? state.activeWallet.name : null),
		privKey: (state) => {
			if (state.activeClient) {
				return keyToWif(state.activeClient.signer.privkey)
			} else {
				return null
			}
		},
	},
	mutations: {
		SET_ACTIVE_WALLET(state, wallet) {
			state.activeWallet = wallet
			window.localStorage.setItem('lastWallet', wallet.name)
		},
		SET_ACTIVE_CLIENT(state, client) {
			state.activeClient = client
			state.authorized = true
		},
		ADD_WALLET(state, wallet) {
			state.activeWallet = wallet
			window.localStorage.setItem('lastWallet', wallet.name)
			if (state.activeWallet.name && state.activeWallet.password) {
				state.wallets.push({
					name: state.activeWallet.name,
					wallet: CryptoJS.AES.encrypt(JSON.stringify(state.activeWallet), state.activeWallet.password).toString(),
				})
			}
			if (state.activeWallet.name == 'Keplr Integration' && !state.activeWallet.password) {
				state.wallets.push({
					name: state.activeWallet.name,
					wallet: JSON.stringify(state.activeWallet),
				})
			}
		},
		PATH_INCREMENT(state) {
			state.activeWallet.pathIncrement = state.activeWallet.pathIncrement + 1
		},
		ADD_ACCOUNT(state, account) {
			state.activeWallet.accounts.push(account)
			if (state.activeWallet.name && state.activeWallet.password) {
				state.wallets[state.wallets.findIndex((x) => x.name === state.activeWallet.name)].wallet = CryptoJS.AES.encrypt(
					JSON.stringify(state.activeWallet),
					state.activeWallet.password,
				).toString()
			}
		},
		SET_RELAYERS(state, relayers) {
			state.activeWallet.accounts.find((x) => x.address == state.selectedAddress).relayers = relayers
			if (state.activeWallet.name && state.activeWallet.password) {
				state.wallets[state.wallets.findIndex((x) => x.name === state.activeWallet.name)].wallet = CryptoJS.AES.encrypt(
					JSON.stringify(state.activeWallet),
					state.activeWallet.password,
				).toString()
			}
		},
		SET_SELECTED_ADDRESS(state, address) {
			state.selectedAddress = address
		},
		SET_BACKUP_STATE(state, backupState) {
			state.backupState = backupState
		},
		ADD_MESSAGE_TYPE(state, { typeUrl, type }) {
			state.activeClient.registry.register(typeUrl, type)
		},
		SIGN_OUT(state) {
			state.selectedAddress = ''
			state.activeClient = null
			state.activeWallet = null
			state.authorized = false
		},
	},
	actions: {
		signOut({ commit }) {
			commit('SIGN_OUT')
		},
		async connectWithKeplr({ commit, dispatch, rootGetters }, accountSigner) {
			await dispatch('common/env/signIn', accountSigner, {
				root: true,
			})

			const wallet = {
				name: 'Keplr Integration',
				mnemonic: null,
				HDpath: null,
				password: null,
				prefix: rootGetters['common/env/addrPrefix'],
				pathIncrement: null,
				accounts: [],
			}
			const [account] = await accountSigner.getAccounts()
			wallet.accounts.push({ address: account.address, pathIncrement: null })
			commit('ADD_WALLET', wallet)

			try {
				await dispatch('common/env/signIn', accountSigner, { root: true })

				let client = rootGetters['common/env/signingClient']
				commit('SET_ACTIVE_CLIENT', client)
				commit('SET_SELECTED_ADDRESS', account.address)
			} catch (e) {
				console.log(e)
			}
			dispatch('storeWallets')
		},
		async unlockWallet({ commit, state, dispatch, rootGetters }, { name, password }) {
			const encryptedWallet = state.wallets[state.wallets.findIndex((x) => x.name === name)].wallet
			let wallet
			if (name == 'Keplr Integration') {
				wallet = JSON.parse(encryptedWallet)
			} else {
				wallet = JSON.parse(CryptoJS.AES.decrypt(encryptedWallet, password).toString(CryptoJS.enc.Utf8))
			}
			commit('SET_ACTIVE_WALLET', wallet)
			if (wallet.accounts.length > 0) {
				let accountSigner
				if (wallet.name == 'Keplr Integration') {
					accountSigner = window.getOfflineSigner(rootGetters['common/env/chainId'])
				} else {
					accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(wallet.mnemonic, {
						HDPaths: [stringToPath(wallet.HDpath + wallet.accounts[0].pathIncrement)],
						prefix: wallet.prefix,
					})
				}
				try {
					await dispatch('common/env/signIn', accountSigner, {
						root: true,
					})
					let client = rootGetters['common/env/signingClient']
					commit('SET_ACTIVE_CLIENT', client)
					const [account] = await accountSigner.getAccounts()
					commit('SET_SELECTED_ADDRESS', account.address)
				} catch (e) {
					console.log(e)
				}
			}
		},
		async updateRelayers({ commit, dispatch }, relayers) {
			commit('SET_RELAYERS', relayers)
			dispatch('storeWallets')
		},
		async switchAccount({ commit, state, rootGetters, dispatch }, address) {
			const accountIndex = state.activeWallet.accounts.findIndex((acc) => acc.address == address)
			const accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(state.activeWallet.mnemonic, {
				HDPaths: [stringToPath(state.activeWallet.HDpath + state.activeWallet.accounts[accountIndex].pathIncrement)],
				prefix: state.activeWallet.prefix,
			})

			try {
				await dispatch('common/env/signIn', accountSigner, { root: true })
				let client = rootGetters['common/env/signingClient']
				commit('SET_ACTIVE_CLIENT', client)
				const [account] = await accountSigner.getAccounts()
				commit('SET_SELECTED_ADDRESS', account.address)
			} catch (e) {
				console.log(e)
			}
		},
		async addAccount({ commit, state, dispatch }, pathIncrement) {
			if (!pathIncrement) {
				pathIncrement = state.activeWallet.pathIncrement + 1
				commit('PATH_INCREMENT')
			}
			const accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(state.activeWallet.mnemonic, {
				HDPaths: [stringToPath(state.activeWallet.HDpath + pathIncrement)],
				prefix: state.activeWallet.prefix,
			})
			const [acc] = await accountSigner.getAccounts()
			const account = {
				address: acc.address,
				pathIncrement: parseInt(pathIncrement),
			}
			if (state.activeWallet.accounts.findIndex((acc) => acc.address == account.address) == -1) {
				commit('ADD_ACCOUNT', account)
				dispatch('storeWallets')
			} else {
				throw 'Account already in store.'
			}
		},
		storeWallets({ commit, state }) {
			window.localStorage.setItem('wallets', JSON.stringify(state.wallets))
			commit('SET_BACKUP_STATE', false)
		},
		async signInWithPrivateKey({ commit, rootGetters, dispatch }, { prefix = 'cosmos', privKey }) {
			const pKey = keyFromWif(privKey.trim())
			const accountSigner = await DirectSecp256k1Wallet.fromKey(pKey, { prefix })
			const [firstAccount] = await accountSigner.getAccounts()

			try {
				await dispatch('common/env/signIn', accountSigner, { root: true })
				let client = rootGetters['common/env/signingClient']
				commit('SET_ACTIVE_CLIENT', client)
				commit('SET_SELECTED_ADDRESS', firstAccount.address)
			} catch (e) {
				console.log(e)
			}
		},
		async restoreWallet({ commit, dispatch, rootGetters, state }, { encrypted, password }) {
			const wallet = JSON.parse(CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8))
			let newName = wallet.name
			let incr = 1
			while (state.wallets.findIndex((x) => x.name == newName) != -1) {
				newName = wallet.name + '_' + incr
				incr++
			}
			wallet.name = newName
			const accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(wallet.mnemonic, {
				HDPaths: [stringToPath(wallet.HDpath + '0')],
				prefix: wallet.prefix,
			})
			const [firstAccount] = await accountSigner.getAccounts()
			commit('ADD_WALLET', wallet)

			try {
				await dispatch('common/env/signIn', accountSigner, { root: true })

				let client = rootGetters['common/env/signingClient']
				commit('SET_ACTIVE_CLIENT', client)
				commit('SET_SELECTED_ADDRESS', firstAccount.address)
			} catch (e) {
				console.log(e)
			}

			dispatch('storeWallets')
		},
		async createWalletWithMnemonic(
			{ commit, dispatch, rootGetters },
			{ name = null, mnemonic, HDpath = "m/44'/118'/0'/0/", prefix = 'cosmos', password = null },
		) {
			const wallet = {
				name,
				mnemonic,
				HDpath,
				password,
				prefix,
				pathIncrement: 0,
				accounts: [],
			}
			const accountSigner = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
				HDPaths: [stringToPath(HDpath + '0')],
				prefix,
			})
			const [firstAccount] = await accountSigner.getAccounts()
			const account = { address: firstAccount.address, pathIncrement: 0 }
			wallet.accounts.push(account)
			commit('ADD_WALLET', wallet)

			try {
				await dispatch('common/env/signIn', accountSigner, { root: true })

				let client = rootGetters['common/env/signingClient']
				commit('SET_ACTIVE_CLIENT', client)
				commit('SET_SELECTED_ADDRESS', firstAccount.address)
			} catch (e) {
				console.log(e)
			}
			dispatch('storeWallets')
		},
		async sendTransaction({ state }, { message, memo, denom }) {
			const fee = {
				amount: [{ amount: '0', denom }],
				gas: '200000',
			}
			try {
				console.log({
					add: state.selectedAddress,
					msg: [message],
					fee,
					memo,
				})
				const result = await state.activeClient.signAndBroadcast(state.selectedAddress, [message], fee, memo)
				assertIsBroadcastTxSuccess(result)
			} catch (e) {
				console.log(e)
				throw 'Failed to broadcast transaction.' + e
			}
		},
	},
}
