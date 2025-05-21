import { compress } from './compression'

function createCodeSandboxProject(html: string): string {
	const parameters = {
		files: {
			'index.html': {
				content: html,
				isBinary: false,
			},
		},
	}

	return compress(JSON.stringify(parameters))
}

export function getCodeSandboxUrl(html: string): string {
	const project = createCodeSandboxProject(html)
	return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${project}`
}
