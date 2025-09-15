import { z } from "zod"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

const MINUS_CHIP_COLOR = "#FADBD8"
const PLUS_CHIP_COLOR = "#FEF9E7"
const BORDER_COLOR = "#212121"
const SYMBOL_COLOR = "#212121"

export const IntegerChipModelPropsSchema = z
	.object({
		type: z.literal("integerChipModel"),
		width: z.number().positive().describe("Total width of the SVG canvas in pixels (e.g., 300)."),
		height: z.number().positive().describe("Total height of the SVG canvas in pixels (e.g., 150)."),
		chipGroups: z
			.array(
				z
					.object({
						count: z.number().int().min(1),
						sign: z.enum(["plus", "minus"])
					})
					.strict()
			)
			.min(1)
			.describe("An array of chip groups, each with a count and a sign (+ or -).")
	})
	.strict()
	.describe("Displays positive (yellow) and negative (red) integer chips to visualize integer arithmetic.")

export type IntegerChipModelProps = z.infer<typeof IntegerChipModelPropsSchema>

export const generateIntegerChipModel: WidgetGenerator<typeof IntegerChipModelPropsSchema> = async (props) => {
	const { width, height, chipGroups } = props

	const chipRadius = 24
	const chipDiameter = chipRadius * 2
	const padding = 10
	const symbolFontSize = 32
	const symbolFontWeight = "600"

	const availableWidth = width - padding * 2
	const chipsPerRow = Math.floor(availableWidth / (chipDiameter + padding))

	if (chipsPerRow === 0) {
		return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"></svg>`
	}

	const svgElements: string[] = []
	let currentX = padding + chipRadius
	let currentY = padding + chipRadius
	let chipsInCurrentRow = 0

	const totalMinus = chipGroups.filter((g) => g.sign === "minus").reduce((s, g) => s + g.count, 0)
	const totalPlus = chipGroups.filter((g) => g.sign === "plus").reduce((s, g) => s + g.count, 0)

	function placeChips(count: number, sign: "plus" | "minus"): void {
		const fillColor = sign === "plus" ? PLUS_CHIP_COLOR : MINUS_CHIP_COLOR
		const symbol = sign === "plus" ? "+" : "−"
		for (let i = 0; i < count; i++) {
			if (chipsInCurrentRow >= chipsPerRow) {
				currentY += chipDiameter + padding
				currentX = padding + chipRadius
				chipsInCurrentRow = 0
			}
			const circle = `<circle cx="${currentX}" cy="${currentY}" r="${chipRadius}" fill="${fillColor}" stroke="${BORDER_COLOR}" stroke-width="2" />`
			const text = `<text x="${currentX}" y="${currentY}" font-size="${symbolFontSize}px" font-weight="${symbolFontWeight}" fill="${SYMBOL_COLOR}" text-anchor="middle" dominant-baseline="central">${symbol}</text>`
			svgElements.push(circle + text)
			currentX += chipDiameter + padding
			chipsInCurrentRow++
		}
	}

	// 1) Place all minus chips in dedicated rows (no mixing with plus)
	placeChips(totalMinus, "minus")

	// 2) Start plus chips on a new row for separation, if needed
	if (totalPlus > 0 && chipsInCurrentRow !== 0) {
		currentY += chipDiameter + padding
		currentX = padding + chipRadius
		chipsInCurrentRow = 0
	}
	placeChips(totalPlus, "plus")

	const requiredHeight = currentY + chipRadius + padding
	const finalHeight = Math.max(height, requiredHeight)
	const svgBody = svgElements.join("\n  ")

	return `<svg width="${width}" height="${finalHeight}" viewBox="0 0 ${width} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}">
  ${svgBody}
</svg>`
}
