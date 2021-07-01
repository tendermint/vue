export function copyToClipboard(str: string): void {
	const el = document.createElement('textarea')
	el.value = str
	document.body.appendChild(el)
	el.select()
	el.setSelectionRange(0, 999999)
	document.execCommand('copy')
	document.body.removeChild(el)
}
export function str2rgba(r: string): string {
	const o = []
	for (let a, c = 0; c < 256; c++) {
		a = c
		for (let f = 0; f < 8; f++) a = 1 & a ? 3988292384 ^ (a >>> 1) : a >>> 1
		o[c] = a
	}
	let n = -1
	for (let t = 0; t < r.length; t++) n = (n >>> 8) ^ o[255 & (n ^ r.charCodeAt(t))]
	return ((-1 ^ n) >>> 0).toString(16)
}
