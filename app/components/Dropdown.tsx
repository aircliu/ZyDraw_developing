/**
 * This file defines a Dropdown component and its associated Item component.
 * The Dropdown provides options to copy a link, copy HTML, and open the content
 * in CodeSandbox or StackBlitz. It's designed to be used with HTML content in a
 * tldraw shape or similar context.
 */

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useCallback } from 'react'
import { stopEventPropagation, useToasts } from '@tldraw/tldraw'
import { createStackBlitzProject } from '../third-parties/stackblitz'
import { getCodeSandboxUrl } from '../third-parties/codesandbox'
import sdk from '@stackblitz/sdk'

export function Dropdown({
	boxShadow,
	children,
	html,
	uploadUrl,
}: {
	boxShadow: string
	children: React.ReactNode
	html: string
	uploadUrl: string
}) {
	const toast = useToasts()

	// Handler to copy the upload URL to clipboard
	const copyLink = useCallback(() => {
		if (navigator && navigator.clipboard) {
			navigator.clipboard.writeText(uploadUrl)
			toast.addToast({
				icon: 'link',
				title: 'Copied link to clipboard',
			})
		}
	}, [uploadUrl, toast])

	// Handler to copy the HTML content to clipboard
	const copyHtml = useCallback(() => {
		if (navigator && navigator.clipboard) {
			navigator.clipboard.writeText(html)
			toast.addToast({
				title: 'Copied HTML to clipboard',
			})
		}
	}, [html, toast])

	// Handler to open the HTML content in CodeSandbox
	const openInCodeSandbox = useCallback(() => {
		try {
			const sandboxUrl = getCodeSandboxUrl(html)
			window.open(sandboxUrl)
		} catch {
			toast.addToast({ title: 'There was a problem opening in CodeSandbox.' })
		}
	}, [html, toast])

	// Handler to open the HTML content in StackBlitz
	const openInStackBlitz = useCallback(() => {
		try {
			const project = createStackBlitzProject(html)
			sdk.openProject(project, { openFile: 'index.html' })
		} catch (e) {
			toast.addToast({ title: 'There was a problem opening in StackBlitz.' })
		}
	}, [html, toast])

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					side="right"
					sideOffset={10}
					align="start"
					className="dropdown-content"
					style={{ boxShadow, background: '#fdfdfd' }}
				>
					<Item action={copyLink}>Copy link</Item>
					<Item action={copyHtml}>Copy HTML</Item>
					<DropdownMenu.Separator className="dropdown-separator" />
					<Item action={openInCodeSandbox}>Open in CodeSandbox</Item>
					<Item action={openInStackBlitz}>Open in StackBlitz</Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}

// Individual dropdown item component
function Item({ action, children }: { action: () => void; children: React.ReactNode }) {
	return (
		<DropdownMenu.Item asChild>
			<button
				className="bg-blue rounded p-2 dots-button"
				style={{
					width: '32px',
					height: '32px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onPointerDown={stopEventPropagation}
				onClick={action}
				onTouchEnd={action}
			>
				{children}
			</button>
		</DropdownMenu.Item>
	)
}
