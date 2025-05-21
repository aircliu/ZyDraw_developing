'use client'

import dynamic from 'next/dynamic'
import '@tldraw/tldraw/tldraw.css'
import { MakeRealButton } from './components/MakeRealButton'
import { PreviewShapeUtil } from './PreviewShape/PreviewShape'
import TutorialButton from './components/TutorialButton'

const Tldraw = dynamic(async () => (await import('@tldraw/tldraw')).Tldraw, {
	ssr: false,
})

const shapeUtils = [PreviewShapeUtil]

export default function Page() {
	return (
		<div className="editor" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
			<Tldraw persistenceKey="make-real" shareZone={<MakeRealButton />} shapeUtils={shapeUtils} />
			<TutorialButton />
		</div>
	)
}
