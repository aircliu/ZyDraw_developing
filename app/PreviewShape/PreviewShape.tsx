import {
	BaseBoxShapeUtil,
	DefaultSpinner,
	HTMLContainer,
	SvgExportContext,
	TLBaseShape,
	Vec,
	stopEventPropagation,
	toDomPrecision,
	useIsEditing,
	useToasts,
	useValue,
} from '@tldraw/tldraw'
import React, { useCallback, useState, useRef, useEffect } from 'react'
import sdk from '@stackblitz/sdk'

// Import from separated files
import { createStackBlitzProject } from '../third-parties/stackblitz'
import { getCodeSandboxUrl } from '../third-parties/codesandbox'

// Define the shape of our Preview component
export type PreviewShape = TLBaseShape<
	'response',
	{
		html: string
		w: number
		h: number
	}
>

export class PreviewShapeUtil extends BaseBoxShapeUtil<PreviewShape> {
	static override type = 'response' as const

	getDefaultProps(): PreviewShape['props'] {
		return {
			html: '',
			w: (960 * 2) / 3,
			h: (540 * 2) / 3,
		}
	}

	// Override various methods to define shape behavior
	override canEdit = () => true
	override isAspectRatioLocked = () => false
	override canResize = () => true
	override canBind = () => false
	override canUnmount = () => false

	override component(shape: PreviewShape) {
		return <PreviewComponent shape={shape} editor={this.editor} />
	}

	// Method to convert the shape to SVG for export
	override toSvg(shape: PreviewShape, _ctx: SvgExportContext): SVGElement | Promise<SVGElement> {
		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
		// Wait for a new screenshot
		return new Promise((resolve, _) => {
			if (window === undefined) return resolve(g)
			const windowListener = (event: MessageEvent) => {
				if (event.data.screenshot && event.data?.shapeid === shape.id) {
					const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
					image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', event.data.screenshot)
					image.setAttribute('width', shape.props.w.toString())
					image.setAttribute('height', shape.props.h.toString())
					g.appendChild(image)
					window.removeEventListener('message', windowListener)
					clearTimeout(timeOut)
					resolve(g)
				}
			}
			const timeOut = setTimeout(() => {
				resolve(g)
				window.removeEventListener('message', windowListener)
			}, 2000)
			window.addEventListener('message', windowListener)
			//request new screenshot
			const firstLevelIframe = document.getElementById(`iframe-1-${shape.id}`) as HTMLIFrameElement
			if (firstLevelIframe) {
				firstLevelIframe.contentWindow!.postMessage(
					{ action: 'take-screenshot', shapeid: shape.id },
					'*'
				)
			} else {
				console.log('first level iframe not found or not accessible')
			}
		})
	}

	indicator(shape: PreviewShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}

// New functional component that uses Hooks
function PreviewComponent({ shape, editor }: { shape: PreviewShape; editor: any }) {
	const isEditing = useIsEditing(shape.id)

	const boxShadow = useValue(
		'box shadow',
		() => {
			const rotation = editor.getShapePageTransform(shape)!.rotation()
			return getRotatedBoxShadow(rotation)
		},
		[editor]
	)

	const htmlToUse = shape.props.html.replace(
		`</body>`,
		`<script src="https://unpkg.com/html2canvas"></script><script>
		// send the screenshot to the parent window
		window.addEventListener('message', function(event) {
		if (event.data.action === 'take-screenshot' && event.data.shapeid === "${shape.id}") {
		html2canvas(document.body, {useCors : true}).then(function(canvas) {
			const data = canvas.toDataURL('image/png');
			window.parent.postMessage({screenshot: data, shapeid: "${shape.id}"}, "*");
		});
		}
		}, false);
		document.body.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); return }, { passive: false })</script>
</body>`
	)

	const uploadUrl = `data:text/html,${encodeURIComponent(shape.props.html)}`

	return (
		<HTMLContainer className="tl-embed-container" id={shape.id} style={{ overflow: 'visible' }}>
			{htmlToUse ? (
				<iframe
					id={`iframe-1-${shape.id}`}
					srcDoc={htmlToUse}
					width={toDomPrecision(shape.props.w)}
					height={toDomPrecision(shape.props.h)}
					draggable={false}
					style={{
						pointerEvents: isEditing ? 'auto' : 'none',
						boxShadow,
						border: '1px solid var(--color-panel-contrast)',
						borderRadius: 'var(--radius-2)',
					}}
				/>
			) : (
				<div
					style={{
						width: '100%',
						height: '100%',
						backgroundColor: 'var(--color-muted-2)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: '1px solid var(--color-muted-1)',
					}}
				>
					<DefaultSpinner />
				</div>
			)}
			{/* Dropdown menu for additional options */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					right: -40,
					height: 40,
					width: 40,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					pointerEvents: 'all',
					zIndex: 999999,
				}}
				onPointerDown={(e) => e.stopPropagation()}
			>
				<Dropdown html={shape.props.html} uploadUrl={uploadUrl}>
					<button
						style={{
							boxShadow,
							backgroundColor: 'white',
							border: '1px solid var(--color-panel-contrast)',
							borderRadius: '8px',
							padding: '8px',
							fontSize: '16px',
							lineHeight: '1',
							cursor: 'pointer',
							width: '32px',
							height: '32px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontFamily: 'monospace',
						}}
					>
						•••
					</button>
				</Dropdown>
			</div>
			{/* Instructions for interacting with the shape */}
			{htmlToUse && (
				<div
					style={{
						textAlign: 'center',
						position: 'absolute',
						bottom: isEditing ? -40 : 0,
						padding: 4,
						fontFamily: 'inherit',
						fontSize: 12,
						left: 0,
						width: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						pointerEvents: 'none',
					}}
				>
					<span
						style={{
							background: 'var(--color-panel)',
							padding: '4px 12px',
							borderRadius: 99,
							border: '1px solid var(--color-muted-1)',
						}}
					>
						{isEditing ? 'Click the canvas to exit' : 'Double click to interact'}
					</span>
				</div>
			)}
		</HTMLContainer>
	)
}

// Helper function to calculate rotated box shadow
function getRotatedBoxShadow(rotation: number) {
	const cssStrings = ROTATING_BOX_SHADOWS.map((shadow) => {
		const { offsetX, offsetY, blur, spread, color } = shadow
		const vec = new Vec(offsetX, offsetY)
		const { x, y } = vec.rot(-rotation)
		return `${x}px ${y}px ${blur}px ${spread}px ${color}`
	})
	return cssStrings.join(', ')
}

const ROTATING_BOX_SHADOWS = [
	{
		offsetX: 0,
		offsetY: 2,
		blur: 4,
		spread: -1,
		color: '#0000003a',
	},
	{
		offsetX: 0,
		offsetY: 3,
		blur: 12,
		spread: -2,
		color: '#0000001f',
	},
]

// Dropdown component for additional options
function Dropdown({
	children,
	html,
	uploadUrl,
}: {
	children: React.ReactNode
	html: string
	uploadUrl: string
}) {
	const toast = useToasts()
	const [open, setOpen] = React.useState(false)
	const dropdownRef = React.useRef<HTMLDivElement>(null)

	// Close dropdown when clicking outside
	React.useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setOpen(false)
			}
		}

		if (open) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => {
				document.removeEventListener('mousedown', handleClickOutside)
			}
		}
	}, [open])

	// Handler functions for dropdown options
	const copyLink = useCallback(() => {
		if (navigator && navigator.clipboard) {
			navigator.clipboard.writeText(uploadUrl)
			toast.addToast({
				icon: 'link',
				title: 'Copied link to clipboard',
			})
		}
		setOpen(false)
	}, [uploadUrl, toast])

	const copyHtml = useCallback(() => {
		if (navigator && navigator.clipboard) {
			navigator.clipboard.writeText(html)
			toast.addToast({
				title: 'Copied HTML to clipboard',
			})
		}
		setOpen(false)
	}, [html, toast])

	const openInCodeSandbox = useCallback(() => {
		try {
			const sandboxUrl = getCodeSandboxUrl(html)
			window.open(sandboxUrl, '_blank')
		} catch (e) {
			console.error('Error opening CodeSandbox:', e)
			toast.addToast({ title: 'There was a problem opening in CodeSandbox.' })
		}
		setOpen(false)
	}, [html, toast])

	const openInStackBlitz = useCallback(() => {
		try {
			const project = createStackBlitzProject(html)
			sdk.openProject(project, { openFile: 'index.html' })
		} catch (e) {
			console.error('Error opening StackBlitz:', e)
			toast.addToast({ title: 'There was a problem opening in Stackblitz.' })
		}
		setOpen(false)
	}, [html, toast])

	return (
		<div style={{ position: 'relative' }} ref={dropdownRef}>
			<div
				onClick={() => {
					console.log('Button clicked, toggling dropdown')
					setOpen(!open)
				}}
				style={{ cursor: 'pointer' }}
			>
				{children}
			</div>
			{open && (
				<div
					onClick={(e) => {
						e.stopPropagation()
						e.preventDefault()
					}}
					style={{
						position: 'absolute',
						top: '35px',
						left: '0',
						minWidth: '200px',
						backgroundColor: '#ffffff',
						borderRadius: '8px',
						padding: '6px',
						boxShadow:
							'0 10px 38px -10px rgba(22, 23, 24, 0.35), 0 10px 20px -15px rgba(22, 23, 24, 0.2)',
						border: '2px solid #333',
						zIndex: 999999999,
					}}
				>
					<button
						onClick={copyLink}
						style={{
							display: 'block',
							width: '100%',
							padding: '8px 12px',
							fontSize: '14px',
							textAlign: 'left',
							backgroundColor: 'transparent',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
							fontFamily: 'inherit',
							color: '#000',
							outline: 'none',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#f0f0f0'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent'
						}}
					>
						Copy link
					</button>
					<button
						onClick={copyHtml}
						style={{
							display: 'block',
							width: '100%',
							padding: '8px 12px',
							fontSize: '14px',
							textAlign: 'left',
							backgroundColor: 'transparent',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
							fontFamily: 'inherit',
							color: '#000',
							outline: 'none',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#f0f0f0'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent'
						}}
					>
						Copy HTML
					</button>
					<div
						style={{
							height: '1px',
							margin: '6px 0',
							backgroundColor: '#e5e5e5',
						}}
					/>
					<button
						onClick={openInCodeSandbox}
						style={{
							display: 'block',
							width: '100%',
							padding: '8px 12px',
							fontSize: '14px',
							textAlign: 'left',
							backgroundColor: 'transparent',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
							fontFamily: 'inherit',
							color: '#000',
							outline: 'none',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#f0f0f0'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent'
						}}
					>
						Open in CodeSandbox
					</button>
					<button
						onClick={openInStackBlitz}
						style={{
							display: 'block',
							width: '100%',
							padding: '8px 12px',
							fontSize: '14px',
							textAlign: 'left',
							backgroundColor: 'transparent',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
							fontFamily: 'inherit',
							color: '#000',
							outline: 'none',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#f0f0f0'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent'
						}}
					>
						Open in StackBlitz
					</button>
				</div>
			)}
		</div>
	)
}
