import { Project } from '@stackblitz/sdk'

export function createStackBlitzProject(html: string): Project {
	const stackblitzProject: Project = {
		title: 'Zydraw HTML Editor',
		template: 'html',
		files: { 'index.html': html },
	}
	return stackblitzProject
}
