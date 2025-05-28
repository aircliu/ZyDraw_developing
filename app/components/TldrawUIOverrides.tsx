import {
	TLUiOverrides,
	Editor,
	TLUiMenuGroup,
	menuGroup,
	menuItem,
	menuSubmenu,
} from '@tldraw/tldraw'

// Define template shapes data
const templates = [
	{
		id: 'landing-page',
		name: 'Landing Page',
		description: 'Basic landing page template',
		shapes: [],
	},
	{
		id: 'dashboard',
		name: 'Dashboard',
		description: 'Admin dashboard template',
		shapes: [],
	},
	{
		id: 'mobile-app',
		name: 'Mobile App',
		description: 'Mobile app wireframe',
		shapes: [],
	},
]

// Function to load a template
function loadTemplate(editor: Editor, templateId: string) {
	const template = templates.find((t) => t.id === templateId)
	if (!template) return

	// Clear current selection
	editor.selectNone()

	// Create template shapes based on templateId
	switch (templateId) {
		case 'landing-page':
			editor.createShapes([
				{
					type: 'geo',
					x: 100,
					y: 100,
					props: {
						w: 800,
						h: 100,
						geo: 'rectangle',
						fill: 'solid',
						color: 'blue',
						text: 'Header',
					},
				},
				{
					type: 'geo',
					x: 100,
					y: 220,
					props: {
						w: 800,
						h: 400,
						geo: 'rectangle',
						fill: 'solid',
						color: 'light-blue',
						text: 'Hero Section',
					},
				},
			])
			break
		case 'dashboard':
			editor.createShapes([
				{
					type: 'geo',
					x: 100,
					y: 100,
					props: {
						w: 200,
						h: 600,
						geo: 'rectangle',
						fill: 'solid',
						color: 'grey',
						text: 'Sidebar',
					},
				},
				{
					type: 'geo',
					x: 320,
					y: 100,
					props: {
						w: 680,
						h: 600,
						geo: 'rectangle',
						fill: 'solid',
						color: 'light-grey',
						text: 'Main Content',
					},
				},
			])
			break
		default:
			editor.createShapes([
				{
					type: 'text',
					x: 100,
					y: 100,
					props: {
						text: `${template.name} Template`,
						size: 'xl',
					},
				},
			])
	}

	editor.zoomToFit()
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
					},
					readonlyOk: false,
				})
			)
		)

		// Insert after View menu if found, otherwise at the end
		if (viewIndex !== -1) {
			newMainMenuGroup.children.splice(viewIndex + 1, 0, templatesSubmenu)
		} else {
			newMainMenuGroup.children.push(templatesSubmenu)
		}

		// Replace the original menu group
		customMenu[mainMenuIndex] = newMainMenuGroup

		return customMenu
	},
}
