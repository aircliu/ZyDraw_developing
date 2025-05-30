import {
	TLUiOverrides,
	Editor,
	TLUiMenuGroup,
	menuGroup,
	menuItem,
	menuSubmenu,
	TLShapePartial,
} from '@tldraw/tldraw'

// Define template types (will be populated from database)
const templates = [
	{
		id: 'landing-page',
		name: 'Landing Page',
		description: 'Basic landing page template',
		shapes: [], // Will be populated from database
	},
	{
		id: 'dashboard',
		name: 'Dashboard',
		description: 'Admin dashboard template',
		shapes: [], // Will be populated from database
	},
	{
		id: 'mobile-app',
		name: 'Mobile App',
		description: 'Mobile app wireframe',
		shapes: [], // Will be populated from database
	},
]

// Function to create a new project
async function createNewProject(editor: Editor) {
	const name = window.prompt('Enter a name for your new project:')
	if (!name) return

	// Clear the canvas
	editor.selectAll()
	editor.deleteShapes(editor.getSelectedShapeIds())
	editor.selectNone()

	// Get or create user ID
	let userId = localStorage.getItem('zydraw_user_id')
	if (!userId) {
		userId = crypto.randomUUID()
		localStorage.setItem('zydraw_user_id', userId)
	}

	// Save as a new project with empty shapes
	try {
		const response = await fetch('/api/health/designs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name,
				userId,
				shapes: [], // Empty canvas
			}),
		})

		if (!response.ok) {
			throw new Error('Failed to create project')
		}

		const data = await response.json()

		// Store the current project ID
		localStorage.setItem('current_project_id', data.id)
		localStorage.setItem('current_project_name', name)

		// Show success message
		// @ts-ignore
		editor.addToast?.({
			title: 'Project created!',
			description: `Created "${name}"`,
		})
	} catch (error) {
		console.error('Error creating project:', error)
		// @ts-ignore
		editor.addToast?.({
			title: 'Failed to create project',
			severity: 'error',
		})
	}
}

// Function to load template from database
async function loadTemplateFromDatabase(
	templateId: string,
	userId: string
): Promise<TLShapePartial[] | null> {
	try {
		const res = await fetch(`/api/health/templates/${templateId}?userId=${userId}`)
		if (!res.ok) throw new Error('Failed to fetch template')
		const templateData = await res.json()
		return templateData.shapes || null
	} catch (err) {
		console.error('Error fetching template:', err)
		return null
	}
}

// Function to load user's saved projects list from database
async function loadUserProjects(userId: string): Promise<any[]> {
	try {
		const res = await fetch(`/api/health/designs?userId=${userId}`)
		if (!res.ok) throw new Error('Failed to fetch projects')
		return await res.json()
	} catch (err) {
		console.error('Error fetching projects:', err)
		return []
	}
}

// Function to load a specific user project
async function loadUserProject(editor: Editor, projectId: string, projectName: string) {
	// Clear current selection
	editor.selectNone()

	const userId = localStorage.getItem('zydraw_user_id') || 'shared-user'

	try {
		const res = await fetch(`/api/health/designs/${projectId}?userId=${userId}`)
		if (!res.ok) throw new Error('Failed to fetch project')
		const projectData = await res.json()

		// Clear canvas
		editor.selectAll()
		editor.deleteShapes(editor.getSelectedShapeIds())
		editor.selectNone()

		// Load the project shapes
		if (projectData.shapes && projectData.shapes.length > 0) {
			editor.createShapes(projectData.shapes)
			editor.zoomToFit()
		}

		// Store current project ID and name
		localStorage.setItem('current_project_id', projectId)
		localStorage.setItem('current_project_name', projectName)

		// @ts-ignore
		editor.addToast?.({
			title: 'Project loaded!',
			description: `Loaded "${projectData.name}"`,
		})
	} catch (error) {
		console.error('Error loading project:', error)
		editor.createShapes([
			{
				type: 'text',
				x: 100,
				y: 100,
				props: {
					text: `Error loading project. Please try again.`,
					size: 'l',
					color: 'red',
				},
			},
		])
	}
}

// Function to load a template
async function loadTemplate(editor: Editor, templateId: string) {
	const template = templates.find((t) => t.id === templateId)
	if (!template) {
		console.error(`Template ${templateId} not found`)
		return
	}

	// Clear current selection
	editor.selectNone()

	// TODO: Get userId from your auth system
	const userId = localStorage.getItem('zydraw_user_id') || 'shared-user'

	try {
		// Attempt to load user's saved template from database
		const savedShapes = await loadTemplateFromDatabase(templateId, userId)

		if (savedShapes !== null && savedShapes.length > 0) {
			// Load the user's saved template
			editor.createShapes(savedShapes)
			editor.zoomToFit()
		} else {
			// No saved template found - just show a message
			editor.createShapes([
				{
					type: 'text',
					x: 100,
					y: 100,
					props: {
						text: `No saved "${template.name}" template found.\nPlease check your templates or create a new design.`,
						size: 'l',
					},
				},
			])
		}
	} catch (error) {
		console.error('Error loading template:', error)
		// Show error message to user
		editor.createShapes([
			{
				type: 'text',
				x: 100,
				y: 100,
				props: {
					text: `Error loading template. Please try again.`,
					size: 'l',
					color: 'red',
				},
			},
		])
	}
}

export const uiOverrides: TLUiOverrides = {
	menu(editor, menu) {
		// Clone the menu
		const customMenu = [...menu]

		// Find the main menu group
		const mainMenuIndex = customMenu.findIndex(
			(item) => item && item.type === 'group' && (item as TLUiMenuGroup).id === 'menu'
		)

		if (mainMenuIndex === -1) return menu

		const mainMenuGroup = customMenu[mainMenuIndex] as TLUiMenuGroup

		// Clone the main menu group and its children
		const newMainMenuGroup: TLUiMenuGroup = {
			...mainMenuGroup,
			children: [...mainMenuGroup.children],
		}

		// Find the View menu position with null checks
		let viewIndex = -1
		for (let i = 0; i < newMainMenuGroup.children.length; i++) {
			const child = newMainMenuGroup.children[i]
			// Add null check here
			if (child && child.type === 'submenu' && child.id === 'view') {
				viewIndex = i
				break
			}
		}

		// Create the Templates submenu
		const templatesSubmenu = menuSubmenu(
			'templates',
			'Templates',
			...templates.map((template) =>
				menuItem({
					id: `template-${template.id}`,
					label: template.name,
					onSelect: () => loadTemplate(editor, template.id),
					readonlyOk: false,
				})
			),
			menuGroup(
				'template-actions',
				menuItem({
					id: 'manage-templates',
					label: 'Manage Templates...',
					onSelect: () => {
						console.log('Open template manager')
						// TODO: Open a modal/dialog for template management
					},
					readonlyOk: false,
				})
			)
		)

		// Create the Projects submenu
		const projectsSubmenu = menuSubmenu(
			'projects',
			'Projects',
			menuGroup(
				'project-new',
				menuItem({
					id: 'new-project',
					label: 'New Project',
					onSelect: () => createNewProject(editor),
					readonlyOk: false,
				})
			),
			menuGroup(
				'user-projects',
				menuItem({
					id: 'loading-projects',
					label: 'Loading projects...',
					onSelect: () => {},
					readonlyOk: true,
				})
			)
		)

		// Load user projects asynchronously and update menu
		const userId = localStorage.getItem('zydraw_user_id') || 'shared-user'
		loadUserProjects(userId).then((projects) => {
			// Update the Projects submenu with actual projects
			const updatedProjectsSubmenu = menuSubmenu(
				'projects',
				'Projects',
				menuGroup(
					'project-new',
					menuItem({
						id: 'new-project',
						label: 'New Project',
						onSelect: () => createNewProject(editor),
						readonlyOk: false,
					})
				),
				projects.length > 0
					? menuGroup(
							'user-projects',
							...projects.map((project) =>
								menuItem({
									id: `project-${project.id}`,
									label: project.name,
									onSelect: () => loadUserProject(editor, project.id, project.name),
									readonlyOk: false,
								})
							)
					  )
					: menuGroup(
							'no-projects',
							menuItem({
								id: 'no-projects',
								label: 'No saved projects',
								onSelect: () => {},
								readonlyOk: true,
							})
					  ),
				menuGroup(
					'project-actions',
					menuItem({
						id: 'manage-projects',
						label: 'Manage Projects...',
						onSelect: () => {
							console.log('Open project manager')
							// TODO: Open a modal/dialog for project management
						},
						readonlyOk: false,
					})
				)
			)

			// Find and replace the projects submenu in the menu
			const menuIndex = newMainMenuGroup.children.findIndex(
				(item) => item && item.type === 'submenu' && item.id === 'projects'
			)
			if (menuIndex !== -1) {
				newMainMenuGroup.children[menuIndex] = updatedProjectsSubmenu
				// Force menu update
				editor.updateInstanceState({ isChangingStyle: true })
				editor.updateInstanceState({ isChangingStyle: false })
			}
		})

		// Insert both submenus after View menu if found, otherwise at the end
		if (viewIndex !== -1) {
			newMainMenuGroup.children.splice(viewIndex + 1, 0, templatesSubmenu, projectsSubmenu)
		} else {
			newMainMenuGroup.children.push(templatesSubmenu, projectsSubmenu)
		}

		// Replace the original menu group
		customMenu[mainMenuIndex] = newMainMenuGroup

		return customMenu
	},
}
