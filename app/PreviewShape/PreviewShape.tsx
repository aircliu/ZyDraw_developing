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
import { WebContainer } from '@webcontainer/api'
import { createStackBlitzProject } from '../third-parties/stackblitz'
import { getCodeSandboxUrl } from '../third-parties/codesandbox'

// WebContainer singleton instance
let webcontainerInstance: WebContainer | null = null
let webcontainerPromise: Promise<WebContainer> | null = null

async function getWebContainer(): Promise<WebContainer> {
	if (webcontainerInstance) {
		return webcontainerInstance
	}

	if (webcontainerPromise) {
		return webcontainerPromise
	}

	webcontainerPromise = WebContainer.boot().then((container) => {
		webcontainerInstance = container
		return container
	})

	return webcontainerPromise
}

// Define the shape props interface first
interface PreviewShapeProps {
	html: string
	files?: Array<{ path: string; content: string }>
	w: number
	h: number
}

// Then use it in the shape type - note the correct syntax
export type PreviewShape = TLBaseShape<'response', PreviewShapeProps>

export class PreviewShapeUtil extends BaseBoxShapeUtil<PreviewShape> {
	static override type = 'response' as const

	getDefaultProps(): PreviewShapeProps {
		return {
			html: '',
			files: [],
			w: (960 * 2) / 3,
			h: (540 * 2) / 3,
		}
	}

	override canEdit = () => true
	override isAspectRatioLocked = () => false
	override canResize = () => true
	override canBind = () => false
	override canUnmount = () => false

	override component(shape: PreviewShape) {
		return <PreviewComponent shape={shape} editor={this.editor} />
	}

	override toSvg(shape: PreviewShape, _ctx: SvgExportContext): SVGElement | Promise<SVGElement> {
		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
		const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		rect.setAttribute('width', shape.props.w.toString())
		rect.setAttribute('height', shape.props.h.toString())
		rect.setAttribute('fill', '#f0f0f0')
		rect.setAttribute('stroke', '#333')
		rect.setAttribute('stroke-width', '1')
		rect.setAttribute('rx', '8')

		const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
		text.setAttribute('x', (shape.props.w / 2).toString())
		text.setAttribute('y', (shape.props.h / 2).toString())
		text.setAttribute('text-anchor', 'middle')
		text.setAttribute('fill', '#333')
		text.textContent = 'React App'

		g.appendChild(rect)
		g.appendChild(text)
		return g
	}

	indicator(shape: PreviewShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}

// Rest of the component code remains the same...
function PreviewComponent({ shape, editor }: { shape: PreviewShape; editor: any }) {
	const isEditing = useIsEditing(shape.id)
	const [previewUrl, setPreviewUrl] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const webcontainerRef = useRef<WebContainer | null>(null)
	const toast = useToasts()

	const boxShadow = useValue(
		'box shadow',
		() => {
			const rotation = editor.getShapePageTransform(shape)!.rotation()
			return getRotatedBoxShadow(rotation)
		},
		[editor]
	)

	// Check if this is a React app or legacy HTML
	const isReactApp = !!(shape.props.files && shape.props.files.length > 0)

	useEffect(() => {
		if (isReactApp) {
			setupWebContainer()
		}

		return () => {
			setPreviewUrl('')
			setIsLoading(false)
			setError('')
		}
	}, [shape.props.files])

	async function setupWebContainer() {
		if (!shape.props.files || shape.props.files.length === 0) return

		try {
			setIsLoading(true)
			setError('')

			// Get WebContainer instance
			const webcontainer = await getWebContainer()
			webcontainerRef.current = webcontainer

			// Mount files
			await mountFiles(webcontainer, shape.props.files)

			// Install dependencies
			console.log('Installing dependencies...')
			const installProcess = await webcontainer.spawn('npm', ['install'])

			installProcess.output.pipeTo(
				new WritableStream({
					write(data: string) {
						console.log('[npm install]:', data)
					},
				})
			)

			const installExitCode = await installProcess.exit

			if (installExitCode !== 0) {
				throw new Error('Failed to install dependencies')
			}

			// Start dev server
			console.log('Starting dev server...')
			const devProcess = await webcontainer.spawn('npm', ['run', 'dev'])

			devProcess.output.pipeTo(
				new WritableStream({
					write(data: string) {
						console.log('[npm run dev]:', data)
					},
				})
			)

			// Listen for server ready
			webcontainer.on('server-ready', (port: number, url: string) => {
				console.log(`Server ready on port ${port}: ${url}`)
				setPreviewUrl(url)
				setIsLoading(false)
			})

			// Handle process errors
			devProcess.exit.then((exitCode: number) => {
				if (exitCode !== 0) {
					console.error('Dev server exited with code:', exitCode)
					setError('Dev server crashed')
				}
			})
		} catch (error) {
			console.error('WebContainer error:', error)
			setError(error instanceof Error ? error.message : 'Failed to start preview')
			setIsLoading(false)
		}
	}

	async function mountFiles(
		container: WebContainer,
		files: Array<{ path: string; content: string }>
	) {
		// Clear existing files first
		try {
			const filesToDelete = ['src', 'index.html', 'package.json', 'vite.config.js']
			for (const fileToDelete of filesToDelete) {
				try {
					await container.fs.rm(fileToDelete, { recursive: true })
				} catch (e) {
					// File might not exist, that's ok
				}
			}
		} catch (e) {
			console.log('Could not clear files:', e)
		}

		// Write all files
		for (const file of files) {
			const dir = file.path.substring(0, file.path.lastIndexOf('/'))
			if (dir) {
				try {
					await container.fs.mkdir(dir, { recursive: true })
				} catch (e) {
					// Directory might already exist
				}
			}
			await container.fs.writeFile(file.path, file.content)
			console.log(`Wrote file: ${file.path}`)
		}
	}

	const copyCode = useCallback(() => {
		if (isReactApp && shape.props.files) {
			const codeString = shape.props.files
				.map((file: { path: string; content: string }) => `// ${file.path}\n${file.content}`)
				.join('\n\n' + '='.repeat(50) + '\n\n')

			navigator.clipboard.writeText(codeString)
			toast.addToast({
				title: 'Copied React code to clipboard',
			})
		} else if (shape.props.html) {
			navigator.clipboard.writeText(shape.props.html)
			toast.addToast({
				title: 'Copied HTML to clipboard',
			})
		}
	}, [shape.props, toast, isReactApp])

	const openInStackBlitz = useCallback(() => {
		try {
			if (isReactApp && shape.props.files) {
				const files: Record<string, string> = {}
				shape.props.files.forEach((file: { path: string; content: string }) => {
					files[file.path] = file.content
				})

				sdk.openProject({
					title: 'React App from Zydraw',
					template: 'node',
					files,
				})
			} else if (shape.props.html) {
				const project = createStackBlitzProject(shape.props.html)
				sdk.openProject(project, { openFile: 'index.html' })
			}
		} catch (e) {
			console.error('Error opening StackBlitz:', e)
			toast.addToast({ title: 'Failed to open in StackBlitz' })
		}
	}, [shape.props, toast, isReactApp])

	const openInCodeSandbox = useCallback(() => {
		try {
			if (!isReactApp && shape.props.html) {
				const sandboxUrl = getCodeSandboxUrl(shape.props.html)
				window.open(sandboxUrl, '_blank')
			} else {
				toast.addToast({
					title: 'CodeSandbox export only available for HTML',
					description: 'Use StackBlitz for React apps',
				})
			}
		} catch (e) {
			console.error('Error opening CodeSandbox:', e)
			toast.addToast({ title: 'Failed to open in CodeSandbox' })
		}
	}, [shape.props.html, toast, isReactApp])

	// Render content based on state
	let content: React.ReactNode

	if (error) {
		content = (
			<div
				style={{
					width: '100%',
					height: '100%',
					backgroundColor: 'var(--color-muted-2)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					border: '1px solid var(--color-muted-1)',
					borderRadius: 'var(--radius-2)',
					padding: 20,
				}}
			>
				<div style={{ color: 'var(--color-text-3)', marginBottom: 10 }}>Error</div>
				<div style={{ color: 'var(--color-text-1)', fontSize: 12, textAlign: 'center' }}>
					{error}
				</div>
			</div>
		)
	} else if (isReactApp && previewUrl) {
		content = (
			<iframe
				src={previewUrl}
				width={toDomPrecision(shape.props.w)}
				height={toDomPrecision(shape.props.h)}
				style={{
					pointerEvents: isEditing ? 'auto' : 'none',
					boxShadow,
					border: '1px solid var(--color-panel-contrast)',
					borderRadius: 'var(--radius-2)',
				}}
			/>
		)
	} else if (isReactApp && isLoading) {
		content = (
			<div
				style={{
					width: '100%',
					height: '100%',
					backgroundColor: 'var(--color-muted-2)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					border: '1px solid var(--color-muted-1)',
					borderRadius: 'var(--radius-2)',
				}}
			>
				<DefaultSpinner />
				<div style={{ marginTop: 20, color: 'var(--color-text-3)' }}>Starting React app...</div>
			</div>
		)
	} else if (!isReactApp && shape.props.html) {
		content = (
			<iframe
				srcDoc={shape.props.html}
				width={toDomPrecision(shape.props.w)}
				height={toDomPrecision(shape.props.h)}
				style={{
					pointerEvents: isEditing ? 'auto' : 'none',
					boxShadow,
					border: '1px solid var(--color-panel-contrast)',
					borderRadius: 'var(--radius-2)',
				}}
			/>
		)
	} else {
		content = (
			<div
				style={{
					width: '100%',
					height: '100%',
					backgroundColor: 'var(--color-muted-2)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: '1px solid var(--color-muted-1)',
					borderRadius: 'var(--radius-2)',
				}}
			>
				<DefaultSpinner />
			</div>
		)
	}

	return (
		<HTMLContainer className="tl-embed-container" id={shape.id} style={{ overflow: 'visible' }}>
			{content}

			{/* Dropdown button */}
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
				<Dropdown
					onCopyCode={copyCode}
					onOpenStackBlitz={openInStackBlitz}
					onOpenCodeSandbox={openInCodeSandbox}
					isReactApp={isReactApp}
					boxShadow={boxShadow}
				>
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

			{/* Instructions */}
			{(previewUrl || shape.props.html) && (
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

// Dropdown component
interface DropdownProps {
	children: React.ReactNode
	onCopyCode: () => void
	onOpenStackBlitz: () => void
	onOpenCodeSandbox: () => void
	isReactApp: boolean
	boxShadow: string
}

function Dropdown({
	children,
	onCopyCode,
	onOpenStackBlitz,
	onOpenCodeSandbox,
	isReactApp,
	boxShadow,
}: DropdownProps) {
	const [open, setOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
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

	const buttonStyle: React.CSSProperties = {
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
	}

	return (
		<div style={{ position: 'relative' }} ref={dropdownRef}>
			<div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
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
						right: '0',
						minWidth: '200px',
						backgroundColor: '#ffffff',
						borderRadius: '8px',
						padding: '6px',
						boxShadow,
						border: '2px solid #333',
						zIndex: 999999999,
					}}
				>
					<button
						onClick={() => {
							onCopyCode()
							setOpen(false)
						}}
						style={buttonStyle}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#f0f0f0'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent'
						}}
					>
						{isReactApp ? 'Copy React Code' : 'Copy HTML'}
					</button>
					<div
						style={{
							height: '1px',
							margin: '6px 0',
							backgroundColor: '#e5e5e5',
						}}
					/>
					<button
						onClick={() => {
							onOpenStackBlitz()
							setOpen(false)
						}}
						style={buttonStyle}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = '#f0f0f0'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent'
						}}
					>
						Open in StackBlitz
					</button>
					{!isReactApp && (
						<button
							onClick={() => {
								onOpenCodeSandbox()
								setOpen(false)
							}}
							style={buttonStyle}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f0f0f0'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'transparent'
							}}
						>
							Open in CodeSandbox
						</button>
					)}
				</div>
			)}
		</div>
	)
}

// Helper functions
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
