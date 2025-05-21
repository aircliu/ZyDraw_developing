import { useEditor, useToasts } from '@tldraw/tldraw'
import { useCallback } from 'react'
import { makeReal } from '../lib/makeReal'

/**
 * MakeRealButton Component
 * 
 * Renders a button that triggers the 'makeReal' function on the current TLDraw editor instance.
 * Handles errors by displaying toast notifications.
 */
export function MakeRealButton() {
    const editor = useEditor()
    const { addToast } = useToasts()

    // Handler for button click
    const handleClick = useCallback(async () => {
        try {
            await makeReal(editor)
        } catch (e) {
            console.error(e)
            // Display error toast to user
            addToast({
                icon: 'cross-2',
                title: 'Something went wrong',
                description: (e as Error).message.slice(0, 100), // Truncate long messages
            })
        }
    }, [editor, addToast])

    return (
        <button className="makeRealButton" onClick={handleClick}>
            Make Real
        </button>
    )
}