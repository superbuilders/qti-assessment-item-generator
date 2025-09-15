import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { selectAxisLabels } from "../../utils/layout"
import { estimateWrappedTextDimensions } from "../../utils/text"
import { theme } from "../../utils/theme"
import { buildTicks } from "../../utils/ticks"
import type { WidgetGenerator } from "../types"

// Factory function to create a TickIntervalSchema to avoid $ref issues
const createTickIntervalSchema = () =>
	z
		.discriminatedUnion("type", [
			z
				.object({
					type: z.literal("whole"),
					interval: z.number().positive().describe("Whole number interval between ticks (e.g., 1, 2, 5, 10).")
				})
				.strict(),
			z
				.object({
					type: z.literal("fraction"),
					denominator: z
						.number()
						.int()
						.positive()
						.describe("Denominator for unit fractions (e.g., 5 for fifths, 8 for eighths).")
				})
				.strict()
		])
		.describe("Specification for tick mark intervals.")

// Factory function to create a HighlightedPointSchema to avoid $ref issues
const createHighlightedPointSchema = () =>
	z.discriminatedUnion("type", [
		z
			.object({
				type: z.literal("value"),
				value: z.number().describe("Position on the number line."),
				color: z
					.string()
					.regex(CSS_COLOR_PATTERN, "invalid css color")
					.describe("CSS hex color for the point and its arrow/label."),
				style: z
					.enum(["dot", "arrowAndDot"])
					.describe("Visual style for known points. 'dot' is a circle; 'arrowAndDot' adds an arrow."),
				label: z
					.string()
					.nullable()
					.transform((val) => (val === "" ? null : val))
					.describe("Optional text label. If null, no label is shown.")
			})
			.strict(),
		z
			.object({
				type: z.literal("unknown"),
				value: z.number().describe("Position on the number line."),
				color: z
					.string()
					.regex(CSS_COLOR_PATTERN, "invalid css color")
					.describe("CSS hex color for the box and its arrow/label."),
				style: z
					.enum(["box", "arrowAndBox"])
					.describe("Visual style for unknown points. 'box' is an empty rectangle; 'arrowAndBox' adds an arrow."),
				label: z
					.string()
					.nullable()
					.transform((val) => (val === "" ? null : val))
					.describe("Optional text label. If null, no label is shown.")
			})
			.strict()
	])

export const NumberLinePropsSchema = z
	.object({
		type: z.literal("numberLine").describe("Identifies this as a general-purpose number line widget."),
		width: z
			.number()
			.positive()
			.describe("Total width in pixels for horizontal orientation, or the narrower dimension for vertical."),
		height: z
			.number()
			.positive()
			.describe("Total height in pixels for horizontal orientation, or the longer dimension for vertical."),
		orientation: z.enum(["horizontal", "vertical"]).describe("Direction of the number line."),
		min: z.number().describe("Minimum value shown on the number line."),
		max: z.number().describe("Maximum value shown on the number line."),
		tickInterval: createTickIntervalSchema().describe(
			"Major tick interval specification with full-length ticks and labels."
		),
		secondaryTickInterval: createTickIntervalSchema()
			.nullable()
			.describe("Optional minor tick interval with half-length ticks and no labels."),
		showTickLabels: z.boolean().describe("If true, automatically places non-overlapping labels at major tick marks."),
		highlightedPoints: z
			.array(createHighlightedPointSchema())
			.nullable()
			.describe("An array of special points to mark on the line.")
	})
	.strict()

export type NumberLineProps = z.infer<typeof NumberLinePropsSchema>

// Helper to convert the schema object to a numeric value
const getNumericInterval = (interval: z.infer<ReturnType<typeof createTickIntervalSchema>>): number => {
	return interval.type === "whole" ? interval.interval : 1 / interval.denominator
}

// Helper to format tick labels based on interval type
const formatTickLabel = (value: number, tickInterval: z.infer<ReturnType<typeof createTickIntervalSchema>>): string => {
	if (tickInterval.type === "whole") {
		// For whole number intervals, show integers or decimals as appropriate
		return Number.isInteger(value) ? String(value) : value.toString()
	}
	// For fraction intervals, show as fractions
	const denominator = tickInterval.denominator
	const numerator = Math.round(value * denominator)

	// Handle zero
	if (numerator === 0) return "0"

	// Handle whole numbers (when numerator is a multiple of denominator)
	if (numerator % denominator === 0) {
		return String(numerator / denominator)
	}

	// Simplify the fraction
	const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
	const g = gcd(Math.abs(numerator), denominator)
	const simplifiedNum = numerator / g
	const simplifiedDen = denominator / g

	return `${simplifiedNum}/${simplifiedDen}`
}

export const generateNumberLine: WidgetGenerator<typeof NumberLinePropsSchema> = async (data) => {
	const {
		width,
		height,
		orientation,
		min,
		max,
		tickInterval,
		secondaryTickInterval,
		showTickLabels,
		highlightedPoints
	} = data

	if (min >= max) {
		return `<svg width="${width}" height="${height}"></svg>`
	}

	const isHorizontal = orientation === "horizontal"
	const lineLength = (isHorizontal ? width : height) - 2 * PADDING
	const canvas = new CanvasImpl({
		chartArea: { left: 0, top: 0, width, height },
		fontPxDefault: 12,
		lineHeightDefault: 1.2
	})
	const scale = lineLength / (max - min)

	const majorInterval = getNumericInterval(tickInterval)
	const { values: majorValues } = buildTicks(min, max, majorInterval)

	// Generate custom labels based on tick interval type
	const majorLabels = majorValues.map((value) => formatTickLabel(value, tickInterval))

	const minorValues = secondaryTickInterval
		? buildTicks(min, max, getNumericInterval(secondaryTickInterval)).values
		: []

	if (isHorizontal) {
		const yPos = height / 2
		const toSvgX = (val: number) => PADDING + (val - min) * scale

		canvas.drawLine(PADDING, yPos, width - PADDING, yPos, {
			stroke: theme.colors.axis,
			strokeWidth: theme.stroke.width.thick
		})

		const selectedLabels = selectAxisLabels({
			labels: majorLabels,
			positions: majorValues.map(toSvgX),
			axisLengthPx: lineLength,
			orientation: "horizontal",
			fontPx: theme.font.size.small,
			minGapPx: 8
		})

		// Draw minor ticks first
		for (const t of minorValues) {
			if (!majorValues.some((mt) => Math.abs(mt - t) < 1e-9)) {
				// Avoid drawing over major ticks
				canvas.drawLine(toSvgX(t), yPos - 3, toSvgX(t), yPos + 3, {
					stroke: theme.colors.axis,
					strokeWidth: theme.stroke.width.base
				})
			}
		}

		// Draw major ticks and labels
		majorValues.forEach((t, i) => {
			const x = toSvgX(t)
			canvas.drawLine(x, yPos - 5, x, yPos + 5, {
				stroke: theme.colors.axis,
				strokeWidth: theme.stroke.width.base
			})
			if (showTickLabels && selectedLabels.has(i)) {
				canvas.drawText({
					x,
					y: yPos + 20,
					text: majorLabels[i] ?? "",
					fill: theme.colors.axis,
					anchor: "middle",
					fontPx: theme.font.size.small
				})
			}
		})

		// Draw highlighted points

		if (highlightedPoints) {
			for (const p of highlightedPoints) {
				const px = toSvgX(p.value)
				if (p.type === "value") {
					canvas.drawCircle(px, yPos, 5, {
						fill: p.color,
						stroke: p.color,
						strokeWidth: theme.stroke.width.thin
					})

					if (p.style === "arrowAndDot") {
						const arrowStartY = yPos - 25
						const arrowEndY = yPos - 8
						canvas.drawLine(px, arrowStartY, px, arrowEndY, {
							stroke: theme.colors.axis,
							strokeWidth: theme.stroke.width.thick,
							markerEnd: "url(#action-arrow)"
						})
						if (p.label) {
							const fontPx = theme.font.size.small
							const dims = estimateWrappedTextDimensions(p.label, Number.POSITIVE_INFINITY, fontPx, 1.2)
							const safeY = Math.max(arrowStartY - 5, PADDING + dims.height + 2)
							canvas.drawText({
								x: px,
								y: safeY,
								text: p.label,
								fill: p.color,
								anchor: "middle",
								dominantBaseline: "baseline",
								fontWeight: "700",
								fontPx
							})
						}
					} else if (p.label) {
						const fontPx = theme.font.size.small
						const dims = estimateWrappedTextDimensions(p.label, Number.POSITIVE_INFINITY, fontPx, 1.2)
						const safeY = Math.max(yPos - 15, PADDING + dims.height + 2)
						canvas.drawText({
							x: px,
							y: safeY,
							text: p.label,
							fill: p.color,
							anchor: "middle",
							dominantBaseline: "baseline",
							fontWeight: "700",
							fontPx
						})
					}
				} else {
					// unknown -> render a normal dot, and place an empty box where the label would be
					const boxSize = 12
					// draw the dot at the position (same as known value)
					canvas.drawCircle(px, yPos, 5, {
						fill: p.color,
						stroke: p.color,
						strokeWidth: theme.stroke.width.thin
					})

					if (p.style === "arrowAndBox") {
						// draw arrow pointing to the dot
						const arrowStartY = yPos - 25
						const arrowEndY = yPos - 8
						canvas.drawLine(px, arrowStartY, px, arrowEndY, {
							stroke: theme.colors.axis,
							strokeWidth: theme.stroke.width.thick,
							markerEnd: "url(#action-arrow)"
						})
						// place the box where the arrow label would be
						const labelY = arrowStartY - 5
						canvas.drawRect(px - boxSize / 2, labelY - boxSize / 2, boxSize, boxSize, {
							fill: theme.colors.white,
							stroke: p.color,
							strokeWidth: theme.stroke.width.base
						})
					} else {
						// no arrow: place the box where a dot label would normally go
						const labelY = yPos - 15
						canvas.drawRect(px - boxSize / 2, labelY - boxSize / 2, boxSize, boxSize, {
							fill: theme.colors.white,
							stroke: p.color,
							strokeWidth: theme.stroke.width.base
						})
					}
				}
			}
		}
	} else {
		// Vertical
		const xPos = width / 2
		const toSvgY = (val: number) => height - PADDING - (val - min) * scale

		canvas.drawLine(xPos, PADDING, xPos, height - PADDING, {
			stroke: theme.colors.axis,
			strokeWidth: theme.stroke.width.thick
		})

		const selectedLabels = selectAxisLabels({
			labels: majorLabels,
			positions: majorValues.map(toSvgY),
			axisLengthPx: lineLength,
			orientation: "vertical",
			fontPx: theme.font.size.small,
			minGapPx: 12
		})

		for (const t of minorValues) {
			if (!majorValues.some((mt) => Math.abs(mt - t) < 1e-9)) {
				canvas.drawLine(xPos - 3, toSvgY(t), xPos + 3, toSvgY(t), {
					stroke: theme.colors.axis,
					strokeWidth: theme.stroke.width.base
				})
			}
		}

		majorValues.forEach((t, i) => {
			const y = toSvgY(t)
			canvas.drawLine(xPos - 5, y, xPos + 5, y, {
				stroke: theme.colors.axis,
				strokeWidth: theme.stroke.width.base
			})
			if (showTickLabels && selectedLabels.has(i)) {
				canvas.drawText({
					x: xPos - 10,
					y: y + 4,
					text: majorLabels[i] ?? "",
					fill: theme.colors.axis,
					anchor: "end",
					fontPx: theme.font.size.small
				})
			}
		})

		if (highlightedPoints) {
			for (const p of highlightedPoints) {
				const py = toSvgY(p.value)
				if (p.type === "value") {
					canvas.drawCircle(xPos, py, 5, {
						fill: p.color,
						stroke: p.color,
						strokeWidth: theme.stroke.width.thin
					})

					if (p.style === "arrowAndDot") {
						const arrowStartX = xPos - 25
						const arrowEndX = xPos - 8
						canvas.drawLine(arrowStartX, py, arrowEndX, py, {
							stroke: theme.colors.axis,
							strokeWidth: theme.stroke.width.thick,
							markerEnd: "url(#action-arrow)"
						})
						if (p.label) {
							const fontPx = theme.font.size.small
							const dims = estimateWrappedTextDimensions(p.label, Number.POSITIVE_INFINITY, fontPx, 1.2)
							const safeX = Math.max(arrowStartX - 5, PADDING + 4 + dims.maxWidth)
							canvas.drawText({
								x: safeX,
								y: py,
								text: p.label,
								fill: p.color,
								anchor: "end",
								dominantBaseline: "middle",
								fontWeight: "700",
								fontPx
							})
						}
					} else if (p.label) {
						const fontPx = theme.font.size.small
						const dims = estimateWrappedTextDimensions(p.label, Number.POSITIVE_INFINITY, fontPx, 1.2)
						const safeX = Math.min(xPos + 15, width - PADDING - 4 - dims.maxWidth)
						canvas.drawText({
							x: safeX,
							y: py,
							text: p.label,
							fill: p.color,
							anchor: "start",
							dominantBaseline: "middle",
							fontWeight: "700",
							fontPx
						})
					}
				} else {
					// unknown -> render a normal dot, and place an empty box where the label would be
					const boxSize = 12
					// draw the dot at the position (same as known value)
					canvas.drawCircle(xPos, py, 5, {
						fill: p.color,
						stroke: p.color,
						strokeWidth: theme.stroke.width.thin
					})

					if (p.style === "arrowAndBox") {
						// draw arrow pointing to the dot
						const arrowStartX = xPos - 25
						const arrowEndX = xPos - 8
						canvas.drawLine(arrowStartX, py, arrowEndX, py, {
							stroke: theme.colors.axis,
							strokeWidth: theme.stroke.width.thick,
							markerEnd: "url(#action-arrow)"
						})
						// place the box where the arrow label would be
						const labelX = arrowStartX - 5
						canvas.drawRect(labelX - boxSize / 2, py - boxSize / 2, boxSize, boxSize, {
							fill: theme.colors.white,
							stroke: p.color,
							strokeWidth: theme.stroke.width.base
						})
					} else {
						// no arrow: place the box where a dot label would normally go
						const labelX = xPos + 15
						canvas.drawRect(labelX - boxSize / 2, py - boxSize / 2, boxSize, boxSize, {
							fill: theme.colors.white,
							stroke: p.color,
							strokeWidth: theme.stroke.width.base
						})
					}
				}
			}
		}
	}

	canvas.addDef(
		`<marker id="action-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="${theme.colors.axis}"/></marker>`
	)

	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)
	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}" font-size="12">${svgBody}</svg>`
}
