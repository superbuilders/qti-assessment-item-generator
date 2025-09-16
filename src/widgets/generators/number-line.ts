import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { selectAxisLabels } from "../../utils/layout"
import { theme } from "../../utils/theme"
import { buildTicks } from "../../utils/ticks"
import { MATHML_INNER_PATTERN } from "../../utils/mathml"
import { numberContentToInnerMathML } from "../../utils/number-to-mathml"
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
				type: z.literal("whole"),
				position: z.number().describe("Position on the number line."),
				color: z
					.string()
					.regex(CSS_COLOR_PATTERN, "invalid css color")
					.describe("CSS hex color for the point and its label."),
				style: z
					.literal("dot")
					.describe("Visual style: only 'dot' is supported"),
				value: z.number().int().describe("Integer magnitude (non-directional)"),
				sign: z.enum(["+", "-"]).describe("Sign of the whole number")
			})
			.strict(),
		z
			.object({
				type: z.literal("fraction"),
				position: z.number().describe("Position on the number line."),
				color: z
					.string()
					.regex(CSS_COLOR_PATTERN, "invalid css color")
					.describe("CSS hex color for the point and its label."),
				style: z
					.literal("dot")
					.describe("Visual style: only 'dot' is supported"),
				numerator: z.number().int().min(0).describe("Numerator (non-negative)"),
				denominator: z.number().int().positive().describe("Denominator (positive)"),
				sign: z.enum(["+", "-"]).describe("Sign of the fraction")
			})
			.strict(),
		z
			.object({
				type: z.literal("mixed"),
				position: z.number().describe("Position on the number line."),
				color: z
					.string()
					.regex(CSS_COLOR_PATTERN, "invalid css color")
					.describe("CSS hex color for the point and its label."),
				style: z
					.literal("dot")
					.describe("Visual style: only 'dot' is supported"),
				whole: z.number().int().min(0).describe("Whole part (non-negative)"),
				numerator: z.number().int().min(0).describe("Numerator of the fractional part"),
				denominator: z.number().int().positive().describe("Denominator of the fractional part (positive)"),
				sign: z.enum(["+", "-"]).describe("Sign of the mixed number")
			})
			.strict(),
		z
			.object({
				type: z.literal("mathml"),
				position: z.number().describe("Position on the number line."),
				color: z
					.string()
					.regex(CSS_COLOR_PATTERN, "invalid css color")
					.describe("CSS hex color for the point and its label."),
				style: z
					.literal("dot")
					.describe("Visual style: only 'dot' is supported"),
				mathml: z
					.string()
					.regex(
						MATHML_INNER_PATTERN,
						"invalid mathml snippet; must be inner MathML without outer <math> wrapper"
					)
					.describe("Inner MathML markup (no outer <math> element)")
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

		// Draw highlighted points (new discriminated union with explicit position and MathML labels)

		if (highlightedPoints) {
			for (const p of highlightedPoints) {
				const px = toSvgX(p.position)
				// Draw the point dot
				canvas.drawCircle(px, yPos, 5, {
					fill: p.color,
					stroke: p.color,
					strokeWidth: theme.stroke.width.thin
				})

				// Prepare MathML content
				let inner: string
				if (p.type === "mathml") {
					inner = p.mathml
				} else if (p.type === "whole") {
					inner = numberContentToInnerMathML({ type: "whole", value: p.value, sign: p.sign })
				} else if (p.type === "fraction") {
					inner = numberContentToInnerMathML({ type: "fraction", numerator: p.numerator, denominator: p.denominator, sign: p.sign })
				} else {
					inner = numberContentToInnerMathML({ type: "mixed", whole: p.whole, numerator: p.numerator, denominator: p.denominator, sign: p.sign })
				}

				// Render label near the point (larger font). Ensure consistent gap from axis
				const fontPx = theme.font.size.large
				const labelWidth = 120
				const labelHeight = 32
				const desiredGapFromAxisPx = 18
				// Position the foreignObject so that its BOTTOM edge is a fixed gap above the axis
				// Do not clamp to top padding; allow negative viewBox adjustments to preserve consistent gap
				const safeY = yPos - desiredGapFromAxisPx - labelHeight
				// Bottom-align MathML inside the foreignObject so visual gap is consistent regardless of content height
				const xhtml = `<!DOCTYPE html><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;line-height:1;font-family:${theme.font.family.sans};color:${p.color};"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"inline\" style=\"font-size:${fontPx * 1.2}px;\">${inner}</math></div>`
				canvas.drawForeignObject({
					x: px - labelWidth / 2,
					y: safeY,
					width: labelWidth,
					height: labelHeight,
					content: xhtml
				})
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
				const py = toSvgY(p.position)
				// Draw the point dot
				canvas.drawCircle(xPos, py, 5, {
					fill: p.color,
					stroke: p.color,
					strokeWidth: theme.stroke.width.thin
				})

				// Prepare MathML content
				let inner: string
				if (p.type === "mathml") {
					inner = p.mathml
				} else if (p.type === "whole") {
					inner = numberContentToInnerMathML({ type: "whole", value: p.value, sign: p.sign })
				} else if (p.type === "fraction") {
					inner = numberContentToInnerMathML({ type: "fraction", numerator: p.numerator, denominator: p.denominator, sign: p.sign })
				} else {
					inner = numberContentToInnerMathML({ type: "mixed", whole: p.whole, numerator: p.numerator, denominator: p.denominator, sign: p.sign })
				}

				// Render label near the point (larger font). Ensure consistent gap from vertical axis
				const fontPx = theme.font.size.large
				const labelWidth = 120
				const labelHeight = 32
				const desiredGapFromAxisPx = 15
				// Place the foreignObject so that its LEFT edge is a fixed gap to the right of the axis
				const safeX = Math.min(xPos + desiredGapFromAxisPx, width - PADDING - 2 - labelWidth)
				// Left-align MathML inside the foreignObject so visual gap is consistent regardless of content width
				const xhtml = `<!DOCTYPE html><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:flex-start;width:100%;height:100%;line-height:1;font-family:${theme.font.family.sans};color:${p.color};"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"inline\" style=\"font-size:${fontPx * 1.2}px;\">${inner}</math></div>`
				canvas.drawForeignObject({
					x: safeX,
					y: py - labelHeight / 2,
					width: labelWidth,
					height: labelHeight,
					content: xhtml
				})
			}
		}
	}

	// arrows removed: only 'dot' style is supported; no marker defs needed

	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)
	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}" font-size="12">${svgBody}</svg>`
}
