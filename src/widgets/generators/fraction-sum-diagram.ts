import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { Path2D } from "../../utils/path-builder"
import { estimateWrappedTextDimensions } from "../../utils/text"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

// Custom error for this widget
export const ErrInvalidFractionSum = errors.new("sum of numerators cannot exceed denominator")

/**
 * Defines a group of colored segments, corresponding to a single fraction addend.
 */
const FractionGroupSchema = z
	.object({
		numerator: z
			.number()
			.int()
			.positive()
			.describe("The number of segments in this group, representing the numerator of the fraction."),
		color: z
			.string()
			.regex(CSS_COLOR_PATTERN, "invalid css color")
			.describe("The fill color for this group's segments.")
	})
	.strict()

/**
 * Main Zod schema for the fractionSumDiagram widget.
 */
export const FractionSumDiagramPropsSchema = z
	.object({
		type: z.literal("fractionSumDiagram"),
		width: z.number().positive().describe("Total width of the diagram in pixels."),
		height: z.number().positive().describe("Total height of the diagram in pixels."),
		denominator: z
			.number()
			.int()
			.positive()
			.describe("The common denominator, which also defines the total number of segments in the tape."),
		groups: z
			.array(FractionGroupSchema)
			.min(1)
			.describe(
				"An array of colored segment groups, each representing an addend in the sum. The sum of the numerators must not exceed the denominator."
			)
	})
	.strict()
	.describe(
		"Creates a tape diagram to visually represent the sum of fractions with a common denominator. It shows colored segments for each addend, with mathematical expressions for the sum above and below the tape."
	)

export type FractionSumDiagramProps = z.infer<typeof FractionSumDiagramPropsSchema>

/**
 * Generates an SVG diagram for summing fractions using a tape model.
 */
export const generateFractionSumDiagram: WidgetGenerator<typeof FractionSumDiagramPropsSchema> = async (props) => {
	const { width, height, denominator, groups } = props

	// --- Runtime Validation ---
	const totalNumerator = groups.reduce((sum, group) => sum + group.numerator, 0)
	if (totalNumerator > denominator) {
		logger.error("Invalid fraction sum", { totalNumerator, denominator })
		throw errors.wrap(
			ErrInvalidFractionSum,
			`Sum of numerators (${totalNumerator}) cannot be greater than the denominator (${denominator}).`
		)
	}

	const canvas = new CanvasImpl({
		chartArea: { left: 0, top: 0, width, height },
		fontPxDefault: 12,
		lineHeightDefault: 1.2
	})

	// --- Layout Calculations ---
	// Size layout tuned for legibility. We avoid clipping by sizing based on input height/width.
	const nominalTapeHeight = 80
	const nominalBracketHeight = 30
	const gapBetweenBracketAndTape = 12
	const gapBetweenExprAndBracket = 8

	const tapeAreaWidth = width - PADDING * 4
	const segmentWidth = tapeAreaWidth / denominator
	const tapeStartX = (width - tapeAreaWidth) / 2

	// Compute dynamic heights
	// Emphasize height over width so cells are taller than they are wide
	let tapeHeight = Math.max(64, Math.min(nominalTapeHeight, Math.floor(height * 0.36)))
	let bracketHeight = Math.max(18, Math.min(nominalBracketHeight, Math.floor(height * 0.12)))
	const topExprFontStart = 26
	const bottomExprFontStart = 26
	let archLabelClearance = 40 // extra px gap between arch and its fraction label

	// Place tape vertically leaving room for expressions and brackets
	const estimatedExprBlock = (f: number) => Math.floor(f * 2 + 18)
	let topBlock =
		estimatedExprBlock(topExprFontStart) +
		archLabelClearance +
		bracketHeight +
		gapBetweenExprAndBracket +
		gapBetweenBracketAndTape
	let bottomBlock =
		totalNumerator > 0
			? estimatedExprBlock(bottomExprFontStart) +
				archLabelClearance +
				bracketHeight +
				gapBetweenExprAndBracket +
				gapBetweenBracketAndTape
			: 0
	// Ensure cells are taller than they are wide by targeting a height ratio vs segment width
	const desiredMinHeight = Math.ceil(segmentWidth * 1.3)
	if (tapeHeight < desiredMinHeight) tapeHeight = desiredMinHeight

	let minRequired = topBlock + tapeHeight + bottomBlock + PADDING * 2
	if (minRequired > height) {
		// Prefer shrinking clearance and bracket before tape height
		const blocksOnly = topBlock + bottomBlock
		const availableForBlocks = height - PADDING * 2 - tapeHeight
		if (blocksOnly > availableForBlocks && blocksOnly > 0) {
			const scale = Math.max(0.5, Math.min(1, availableForBlocks / blocksOnly))
			archLabelClearance = Math.max(12, Math.floor(archLabelClearance * scale))
			bracketHeight = Math.max(12, Math.floor(bracketHeight * scale))
			topBlock =
				estimatedExprBlock(topExprFontStart) +
				archLabelClearance +
				bracketHeight +
				gapBetweenExprAndBracket +
				gapBetweenBracketAndTape
			bottomBlock =
				totalNumerator > 0
					? estimatedExprBlock(bottomExprFontStart) +
						archLabelClearance +
						bracketHeight +
						gapBetweenExprAndBracket +
						gapBetweenBracketAndTape
					: 0
		}
		minRequired = topBlock + tapeHeight + bottomBlock + PADDING * 2
		if (minRequired > height) {
			const leftoverForTape = height - PADDING * 2 - (topBlock + bottomBlock)
			tapeHeight = Math.max(40, Math.min(tapeHeight, leftoverForTape))
			// Maintain desired minimum if possible
			tapeHeight = Math.max(Math.min(tapeHeight, nominalTapeHeight), Math.min(desiredMinHeight, leftoverForTape))
		}
	}
	const tapeY = Math.floor(
		PADDING + estimatedExprBlock(topExprFontStart) + bracketHeight + gapBetweenExprAndBracket + gapBetweenBracketAndTape
	)

	// --- Helper Functions for Drawing ---

	/** Compute a font size so the fraction fits inside the provided box. */
	const fitFractionFont = (num: string, den: string, maxWidth: number, maxHeight: number, start: number): number => {
		let fontPx = Math.max(10, start)
		for (;;) {
			const numMetrics = estimateWrappedTextDimensions(num, Number.POSITIVE_INFINITY, fontPx, 1.1)
			const denMetrics = estimateWrappedTextDimensions(den, Number.POSITIVE_INFINITY, fontPx, 1.1)
			const barWidth = Math.max(numMetrics.maxWidth, denMetrics.maxWidth) + 6
			const fracHeight = Math.ceil(numMetrics.height + denMetrics.height + 8)
			const fits = barWidth <= maxWidth && fracHeight <= maxHeight
			if (fits || fontPx <= 10) return fontPx
			fontPx -= 1
		}
	}

	/** Renders a fraction with a horizontal bar (vinculum). */
	const drawFraction = (num: string, den: string, cx: number, y: number, fontPx: number) => {
		const numMetrics = estimateWrappedTextDimensions(num, Number.POSITIVE_INFINITY, fontPx, 1.1)
		const denMetrics = estimateWrappedTextDimensions(den, Number.POSITIVE_INFINITY, fontPx, 1.1)
		const barWidth = Math.max(numMetrics.maxWidth, denMetrics.maxWidth) + 6
		const barHalf = barWidth / 2

		canvas.drawText({ x: cx, y: y - (4 + fontPx * 0.05), text: num, fontPx, anchor: "middle" })
		canvas.drawLine(cx - barHalf, y, cx + barHalf, y, { stroke: "black", strokeWidth: 1.5 })
		canvas.drawText({ x: cx, y: y + (6 + fontPx * 0.6), text: den, fontPx, anchor: "middle" })
	}

	// removed unused helper that measured fraction bar width

	/** Draw a simple arch (single smooth curve) from x1 to x2. */
	const drawArch = (x1: number, x2: number, y: number, isUpward: boolean) => {
		const midX = (x1 + x2) / 2
		const dir = isUpward ? -1 : 1
		const h = bracketHeight
		const path = new Path2D().moveTo(x1, y).quadraticCurveTo(midX, y + dir * h, x2, y)
		canvas.drawPath(path, { stroke: theme.colors.black, strokeWidth: 2, fill: "none" })
	}

	// --- Drawing Logic ---

	// 1. Draw Tape Segments
	let currentSegment = 0
	for (const group of groups) {
		for (let i = 0; i < group.numerator; i++) {
			const x = tapeStartX + currentSegment * segmentWidth
			canvas.drawRect(x, tapeY, segmentWidth, tapeHeight, {
				fill: group.color,
				stroke: theme.colors.black,
				strokeWidth: 1.5
			})
			const cellFont = fitFractionFont(
				"1",
				String(denominator),
				Math.floor(segmentWidth - 4),
				Math.floor(tapeHeight - 6),
				56
			)
			drawFraction("1", String(denominator), x + segmentWidth / 2, Math.floor(tapeY + tapeHeight / 2), cellFont)
			currentSegment++
		}
	}

	// Draw uncolored segments
	const uncoloredCount = denominator - totalNumerator
	for (let i = 0; i < uncoloredCount; i++) {
		const x = tapeStartX + currentSegment * segmentWidth
		canvas.drawRect(x, tapeY, segmentWidth, tapeHeight, {
			fill: "white",
			stroke: theme.colors.black,
			strokeWidth: 1.5
		})
		const cellFont = fitFractionFont(
			"1",
			String(denominator),
			Math.floor(segmentWidth - 4),
			Math.floor(tapeHeight - 6),
			56
		)
		drawFraction("1", String(denominator), x + segmentWidth / 2, Math.floor(tapeY + tapeHeight / 2), cellFont)
		currentSegment++
	}

	// 2. Draw Top Expression and Brackets (aligned with actual brackets)
	const topBracketY = tapeY - gapBetweenBracketAndTape
	const topExpressionY = topBracketY - bracketHeight - gapBetweenExprAndBracket
	let runningX = tapeStartX

	// Precompute top fraction placements to size and collision-manage '+'
	const topFractions: Array<{ startX: number; endX: number; cx: number; fontPx: number; barWidth: number; y: number }> =
		[]
	for (const group of groups) {
		const groupWidth = group.numerator * segmentWidth
		const cxGroup = runningX + groupWidth / 2
		topFractions.push({
			startX: runningX,
			endX: runningX + groupWidth,
			cx: cxGroup,
			fontPx: 18,
			barWidth: groupWidth,
			y: topExpressionY - archLabelClearance
		})
		runningX += groupWidth
	}

	// Draw arches and fractions
	topFractions.forEach((tf, i) => {
		drawArch(tf.startX, tf.endX, topBracketY, true)
		drawFraction(String(groups[i].numerator), String(denominator), tf.cx, tf.y, tf.fontPx)
	})

	// Draw '+' signs centered between adjacent fractions with gap from bars
	const minPlusGap = 18
	const plusFont = 30
	for (let i = 0; i < topFractions.length - 1; i++) {
		const left = topFractions[i]
		const right = topFractions[i + 1]
		const naturalMid = Math.floor((left.endX + right.startX) / 2)
		const leftRightEdge = left.cx + left.barWidth / 2
		const rightLeftEdge = right.cx - right.barWidth / 2
		const minX = Math.floor(leftRightEdge + minPlusGap)
		const maxX = Math.floor(rightLeftEdge - minPlusGap)
		const plusX = Math.max(minX, Math.min(naturalMid, maxX))
		// Align the plus sign with the fraction bar (vinculum) height; center between adjacent bars
		const plusY = Math.floor((left.y + right.y) / 2)
		canvas.drawText({ x: plusX, y: plusY, text: "+", fontPx: plusFont, anchor: "middle", dominantBaseline: "middle" })
	}

	// 3. Draw Bottom Bracket and Sum
	if (totalNumerator > 0) {
		const bottomBracketY = tapeY + tapeHeight + gapBetweenBracketAndTape
		const bottomExpressionY = bottomBracketY + bracketHeight + gapBetweenExprAndBracket
		const coloredWidth = totalNumerator * segmentWidth
		const startX = tapeStartX
		const endX = tapeStartX + coloredWidth
		drawArch(startX, endX, bottomBracketY, false)
		const bottomFont = fitFractionFont(
			String(totalNumerator),
			String(denominator),
			Math.floor(coloredWidth - 10),
			9999,
			bottomExprFontStart
		)
		const yForBottom = bottomExpressionY + archLabelClearance // push further below the arch
		drawFraction(String(totalNumerator), String(denominator), Math.floor((startX + endX) / 2), yForBottom, bottomFont)
	}

	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)

	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}">${svgBody}</svg>`
}
