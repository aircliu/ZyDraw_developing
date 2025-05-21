import * as LZString from 'lz-string'

export function compress(input: string): string {
	return LZString.compressToBase64(input)
		.replace(/\+/g, `-`) // Convert '+' to '-'
		.replace(/\//g, `_`) // Convert '/' to '_'
		.replace(/=+$/, ``) // Remove ending '='
}
