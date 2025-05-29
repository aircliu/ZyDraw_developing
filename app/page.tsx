'use client'

import dynamic from 'next/dynamic'
import '@tldraw/tldraw/tldraw.css'
import { MakeRealButton } from './components/MakeRealButton'
import { PreviewShapeUtil } from './PreviewShape/PreviewShape'
import { uiOverrides } from './components/TldrawUIOverrides'
import React, { useState, useEffect } from 'react'

const Tldraw = dynamic(async () => (await import('@tldraw/tldraw')).Tldraw, {
	ssr: false,
})

const shapeUtils = [PreviewShapeUtil]

export default function Page() {
	const [editor, setEditor] = useState<any>(null)

	const handleSave = async () => {
		if (!editor) {
			alert('Editor not ready. Please try again.')
			return
		}

		const name = window.prompt('Enter a name for this design:')
		if (!name) return

		const shapes = editor.getCurrentPageShapes()

		let userId = localStorage.getItem('zydraw_user_id')
		if (!userId) {
			userId = crypto.randomUUID()
			localStorage.setItem('zydraw_user_id', userId)
		}

		try {
			const response = await fetch('/api/health/designs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, userId, shapes }),
			})

			if (!response.ok) {
				throw new Error('Failed to save')
			}

			alert('Design saved successfully!')
		} catch (error) {
			alert('Failed to save design: ' + (error as Error).message)
		}
	}

	return (
		<div className="editor" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
			<Tldraw
				persistenceKey="make-real"
				shareZone={<MakeRealButton />}
				shapeUtils={shapeUtils}
				overrides={uiOverrides}
				onMount={(editor) => {
					setEditor(editor)
				}}
			/>
			{editor && (
				<button
					onClick={handleSave}
					style={{
						position: 'fixed',
						bottom: '20px',
						right: '20px',
						padding: '10px 20px',
						backgroundColor: '#007bff',
						color: 'white',
						border: 'none',
						borderRadius: '5px',
						cursor: 'pointer',
						zIndex: 1000000,
						fontSize: '16px',
						fontWeight: 'bold',
					}}
				>
					Save Design
				</button>
			)}
		</div>
	)
}
