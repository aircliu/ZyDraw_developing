import { Editor, createShapeId, getSvgAsImage } from '@tldraw/tldraw'
import { getSelectionAsText } from '../lib/getSelectionAsText'
import { getHtmlFromOpenAI } from '../lib/getHtmlFromOpenAI'
import { parseReactApp } from '../lib/parseReactApp'
import { blobToBase64 } from '../utils/blobToBase64'
import { PreviewShape } from '../PreviewShape/PreviewShape'

export async function makeReal(editor: Editor) {
	const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

	if (!apiKey) {
		throw Error('OpenAI API key not configured')
	}

	const selectedShapes = editor.getSelectedShapes()
	if (selectedShapes.length === 0) {
		throw Error('Select something to make real.')
	}

	// Create preview shape
	const { maxX, midY } = editor.getSelectionPageBounds()!
	const newShapeId = createShapeId()

	editor.createShape<PreviewShape>({
		id: newShapeId,
		type: 'response',
		x: maxX + 60,
		y: midY - (540 * 2) / 3 / 2,
		props: {
			html: '',
			files: [],
		},
	})

	try {
		// Get SVG of selection
		const svg = await editor.getSvg(selectedShapes, {
			scale: 1,
			background: true,
		})

		const blob = await getSvgAsImage(svg!, false, {
			type: 'png',
			quality: 0.8,
			scale: 1,
		})

		const dataUrl = await blobToBase64(blob!)

		// Call OpenAI
		const response = await getHtmlFromOpenAI({
			image: dataUrl,
			apiKey,
			text: getSelectionAsText(editor),
			grid: undefined,
			theme: editor.user.getUserPreferences().isDarkMode ? 'dark' : 'light',
		})

		const message = response.choices[0].message.content

		// Parse React app from response
		const parsedApp = parseReactApp(message)

		if (!parsedApp || parsedApp.files.length === 0) {
			throw Error('Could not generate a React app from the design')
		}

		// Update shape with React files
		editor.updateShape<PreviewShape>({
			id: newShapeId,
			type: 'response',
			props: {
				html: '', // Keep empty for backwards compatibility
				files: parsedApp.files,
			},
		})
	} catch (error) {
		editor.deleteShape(newShapeId)
		throw error
	}
}
