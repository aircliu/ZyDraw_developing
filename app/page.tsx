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

		// Check if we're updating an existing project or creating a new one
		const currentProjectId = localStorage.getItem('current_project_id')
		const currentProjectName = localStorage.getItem('current_project_name')

		let name = currentProjectName
		if (!name) {
			name = window.prompt('Enter a name for this project:')
			if (!name) return
		}

		const shapes = editor.getCurrentPageShapes()

		let userId = localStorage.getItem('zydraw_user_id')
		if (!userId) {
			userId = crypto.randomUUID()
			localStorage.setItem('zydraw_user_id', userId)
		}

		try {
			if (currentProjectId) {
				// Update existing project
				const response = await fetch(`/api/health/designs/${currentProjectId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name, shapes }),
				})

				if (!response.ok) {
					throw new Error('Failed to update project')
				}

				alert('Project updated successfully!')
			} else {
				// Create new project
				const response = await fetch('/api/health/designs', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name, userId, shapes }),
				})

				if (!response.ok) {
					throw new Error('Failed to save project')
				}

				const data = await response.json()
				localStorage.setItem('current_project_id', data.id)
				localStorage.setItem('current_project_name', name)

				alert('Project saved successfully!')
			}
		} catch (error) {
			alert('Failed to save project: ' + (error as Error).message)
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
					Save Project
				</button>
			)}
		</div>
	)
}
