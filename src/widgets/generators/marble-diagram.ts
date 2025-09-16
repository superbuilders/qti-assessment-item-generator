import { z } from "zod"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

export const MarbleDiagramPropsSchema = z
	.object({
		type: z.literal("marbleDiagram"),
		blueMarbles: z.number().int().min(0).describe("number of blue marbles"),
		redMarbles: z.number().int().min(0).describe("number of red marbles")
	})
	.strict()
	.describe("Displays blue and red marbles with fixed layout and styling.")

export type MarbleDiagramProps = z.infer<typeof MarbleDiagramPropsSchema>

export const generateMarbleDiagram: WidgetGenerator<typeof MarbleDiagramPropsSchema> = async (props) => {
	const { blueMarbles, redMarbles } = props
	const total = blueMarbles + redMarbles
	if (total === 0) {
		return `<svg width="100" height="50" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}" />`
	}

	// Fixed visual parameters for consistency
	const radius = 24
	const diameter = radius * 2
	const stroke = "#000000"
	const strokeWidth = 2
	const colorBlue = "#5B8DEF"
	const colorRed = "#D0021B"
	const padding = 10
	const clearance = 6 // extra spacing so circles do not visually touch
	const minDist = diameter + clearance

	// Start with a generous square canvas so random packing succeeds
	const sideCount = Math.ceil(Math.sqrt(total)) + 2
	let width = padding * 2 + sideCount * minDist
	let height = padding * 2 + sideCount * minDist

	const innerLeft = padding + radius
	let innerRight = width - padding - radius
	const innerTop = padding + radius
	let innerBottom = height - padding - radius

	// Build color list and shuffle deterministically via Math.random
	const colors: string[] = []
	for (let i = 0; i < blueMarbles; i++) colors.push(colorBlue)
	for (let i = 0; i < redMarbles; i++) colors.push(colorRed)
	for (let i = colors.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		const t = colors[i]
		colors[i] = colors[j]
		colors[j] = t
	}

	type Pt = { x: number; y: number; fill: string }
	const placed: Pt[] = []

	function dist2(a: { x: number; y: number }, b: { x: number; y: number }): number {
		const dx = a.x - b.x
		const dy = a.y - b.y
		return dx * dx + dy * dy
	}

	let requiredDist2 = minDist * minDist
	for (const fill of colors) {
		let attempts = 0
		const maxAttemptsPerMarble = 800
		let placedThis = false
		while (!placedThis) {
			const x = innerLeft + Math.random() * (innerRight - innerLeft)
			const y = innerTop + Math.random() * (innerBottom - innerTop)
			let ok = true
			for (let k = 0; k < placed.length; k++) {
				const p = placed[k]
				if (!p) continue
				if (dist2({ x, y }, p) < requiredDist2) {
					ok = false
					break
				}
			}
			if (ok) {
				placed.push({ x, y, fill })
				placedThis = true
				break
			}
			attempts++
			if (attempts >= maxAttemptsPerMarble) {
				// Expand the canvas deterministically to create more space
				height += minDist
				innerBottom = height - padding - radius
				attempts = 0
			}
		}
	}

	const circles = placed
		.map(
			(p) =>
				`<circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="${p.fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`
		)
		.join("\n  ")

	return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}">
	${circles}
</svg>`
}
