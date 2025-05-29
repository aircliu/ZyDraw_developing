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

// Define user's saved designs (will be populated from database)
const myDesigns = [
	// This will be dynamically loaded from database
	// Example structure:
	// {
	//   id: 'design-1',
	//   name: 'My Homepage Design',
	//   createdAt: '2024-01-15',
	//   updatedAt: '2024-01-16',
	// }
]

// Function to load a template from database
async function loadTemplateFromDatabase(
	templateId: string,
	userId: string
): Promise<TLShapePartial[] | null> {
	try {
		const res = await fetch(`/api/templates/${templateId}?userId=${userId}`)
		if (!res.ok) throw new Error('Failed to fetch template')
		const templateData = await res.json()
		return templateData.shapes || null
	} catch (err) {
		console.error('Error fetching template:', err)
		return null
	}
}

// Function to load user's saved designs list from database
async function loadUserDesigns(userId: string): Promise<any[]> {
	try {
		const res = await fetch(`/api/health/designs?userId=${userId}`)
		if (!res.ok) throw new Error('Failed to fetch designs')
		return await res.json()
	} catch (err) {
		console.error('Error fetching designs:', err)
		return []
	}
}

// Function to load a specific user design
async function loadUserDesign(editor: Editor, designId: string) {
	// Clear current selection
	editor.selectNone()

	const userId = 'current-user-id' // Replace with actual user ID

	try {
		const res = await fetch(`/api/health/designs/${designId}?userId=${userId}`)
		if (!res.ok) throw new Error('Failed to fetch design')
		const designData = await res.json()
		editor.createShapes(designData.shapes)
		editor.zoomToFit()
	} catch (error) {
		console.error('Error loading design:', error)
		editor.createShapes([
			{
				type: 'text',
				x: 100,
				y: 100,
				props: {
					text: `Error loading design. Please try again.`,
					size: 'l',
					color: 'red',
				},
			},
		])
	}
}

// Prompt the user for a name and save the current design
async function saveCurrentDesign(editor: Editor) {
	const name = window.prompt('Enter a name for this design:')
	if (!name) return
	const userId = 'current-user-id' // Replace with actual user ID
	const shapes = editor.getCurrentPageShapes()
	try {
		await fetch('/api/designs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, userId, shapes }),
		})
	} catch (err) {
		console.error('Error saving design:', err)
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
	const userId = 'current-user-id' // Replace with actual user ID

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

		// Create the My Designs submenu
		const myDesignsSubmenu = menuSubmenu(
			'my-designs',
			'My Designs',
			menuItem({
				id: 'loading-designs',
				label: 'Loading designs...',
				onSelect: () => {},
				readonlyOk: true,
			})
		)

		// Load user designs asynchronously and update menu
		const userId = 'current-user-id' // Replace with actual user ID
		loadUserDesigns(userId).then((designs) => {
			// Update the My Designs submenu with actual designs
			const updatedMyDesignsSubmenu = menuSubmenu(
				'my-designs',
				'My Designs',
				designs.length > 0
					? menuGroup(
							'user-designs',
							...designs.map((design) =>
								menuItem({
									id: `design-${design.id}`,
									label: design.name,
									onSelect: () => loadUserDesign(editor, design.id),
									readonlyOk: false,
								})
							)
					  )
					: menuItem({
							id: 'no-designs',
							label: 'No saved designs',
							onSelect: () => {},
							readonlyOk: true,
					  }),
				menuGroup(
					'design-actions',
					menuItem({
						id: 'manage-designs',
						label: 'Manage Designs...',
						onSelect: () => {
							console.log('Open design manager')
							// TODO: Open a modal/dialog for design management
						},
						readonlyOk: false,
					})
				)
			)

			// Find and replace the my-designs submenu in the menu
			const menuIndex = newMainMenuGroup.children.findIndex(
				(item) => item && item.type === 'submenu' && item.id === 'my-designs'
			)
			if (menuIndex !== -1) {
				newMainMenuGroup.children[menuIndex] = updatedMyDesignsSubmenu
				// Force menu update
				editor.updateInstanceState({ isChangingStyle: true })
				editor.updateInstanceState({ isChangingStyle: false })
			}
		})

		// Insert both submenus after View menu if found, otherwise at the end
		if (viewIndex !== -1) {
			newMainMenuGroup.children.splice(viewIndex + 1, 0, templatesSubmenu, myDesignsSubmenu)
		} else {
			newMainMenuGroup.children.push(templatesSubmenu, myDesignsSubmenu)
		}

		// Replace the original menu group
		customMenu[mainMenuIndex] = newMainMenuGroup

		return customMenu
	},
}
