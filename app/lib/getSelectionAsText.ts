/**
 * This file contains a function to convert selected shapes in a TLDraw editor to text.
 * It processes text, geo, arrow, and note shapes, sorting them by their position on the page.
 */

import { Editor, TLGeoShape, TLTextShape } from '@tldraw/tldraw'

/**
 * Converts the selected shapes in a TLDraw editor to text.
 * 
 * @param editor - The TLDraw Editor instance
 * @returns A string containing the text content of selected shapes
 */
export function getSelectionAsText(editor: Editor) {
    // Step 1: Get the IDs of selected shapes and their descendants
    const selectedShapeIds = editor.getSelectedShapeIds()
    const selectedShapeDescendantIds = editor.getShapeAndDescendantIds(selectedShapeIds)

    // Step 2: Convert shape IDs to actual shapes, filter for relevant types, and sort by position
    const texts = Array.from(selectedShapeDescendantIds)
        .map((id) => {
            const shape = editor.getShape(id)!
            return shape
        })
        .filter((shape) => {
            // Step 3: Keep only text, geo, arrow, and note shapes
            return (
                shape.type === 'text' ||
                shape.type === 'geo' ||
                shape.type === 'arrow' ||
                shape.type === 'note'
            )
        })
        .sort((a, b) => {
            // Step 4: Sort shapes by their position on the page (top to bottom, left to right)
            const pageBoundsA = editor.getShapePageBounds(a)!
            const pageBoundsB = editor.getShapePageBounds(b)!
            return pageBoundsA.y === pageBoundsB.y
                ? pageBoundsA.x < pageBoundsB.x
                    ? -1
                    : 1
                : pageBoundsA.y < pageBoundsB.y
                ? -1
                : 1
        })
        .map((shape) => {
            // Step 5: Extract text content from shapes, adding 'Annotation:' prefix for red shapes
            if (!shape) return null
            const text = (shape as TLTextShape | TLGeoShape).props.text ?? null
            if ((shape as TLTextShape | TLGeoShape).props.color === 'red') {
                return `Annotation: ${text}`
            }
            return text
        })
        .filter((v) => !!v) // Step 6: Remove any null values

    // Step 7: Join all text content with newlines and return
    return texts.join('\n')
}