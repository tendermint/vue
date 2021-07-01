import { encode, decode } from 'bs58'
import CryptoJS from 'crypto-js'
export function keyFromWif(wif) {
	return decode(wif).slice(1, 33)
}
export function keyToWif(key) {
	const versionedkey = new Uint8Array(33)
	versionedkey.set([128], 0)
	versionedkey.set(key, 1)
	const words = CryptoJS.lib.WordArray.create(versionedkey)
	const checksum = Buffer.from(CryptoJS.SHA256(CryptoJS.SHA256(words)).toString().substr(0, 8), 'hex')
	const wif = new Uint8Array(37)
	wif.set(versionedkey, 0)
	wif.set(checksum, 33)
	return encode(wif)
}
