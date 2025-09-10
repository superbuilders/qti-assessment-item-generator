import {
	LABEL_AVG_CHAR_WIDTH_PX,
	PADDING,
	TICK_LABEL_FONT_PX,
	X_AXIS_MIN_LABEL_PADDING_PX,
	Y_AXIS_MIN_LABEL_GAP_PX
} from "../utils/constants"
import type { Canvas } from "../utils/layout"
import { selectAxisLabels } from "../utils/layout"
import { theme } from "../utils/theme"
import { drawChartTitle } from "./chart-layout-utils" // ADD THIS IMPORT
import { abbreviateMonth } from "./labels"
import { estimateWrappedTextDimensions } from "./text"
import { buildTicks } from "./ticks"

// Re-export types that are needed for the render functions
export type AxisOptions = {
	label: string
	min: number
	max: number
	tickInterval: number
	showGridLines: boolean
}

// Removed unused function formatPiLabel

/**
 * Sets up a 4-quadrant Cartesian coordinate plane with centered axes using the Canvas API.
 */
export function setupCoordinatePlaneV2(
	data: {
		width: number
		height: number
		xAxis: AxisOptions
		yAxis: AxisOptions
		showQuadrantLabels: boolean
		title?: string | null // ADD THIS PROPERTY
	},
	canvas: Canvas
): {
	toSvgX: (val: number) => number
	toSvgY: (val: number) => number
	chartArea: { top: number; left: number; width: number; height: number }
} {
	const { width, height, xAxis, yAxis, showQuadrantLabels, title } = data // ADD title

	// ADD dynamic margin calculation logic
	const yAxisTickInfo = buildTicks(yAxis.min, yAxis.max, yAxis.tickInterval)
	const maxTickLabelWidth = Math.max(...yAxisTickInfo.labels.map((l) => l.length * LABEL_AVG_CHAR_WIDTH_PX))
	const { height: wrappedTitleHeight } = estimateWrappedTextDimensions(yAxis.label, height, 14)
	// Note: For v2 (4-quadrant), use similar logic but adjust if needed for centered axes.

	const TICK_LENGTH = 4
	const TICK_LABEL_PADDING = 8
	const AXIS_TITLE_PADDING = 12

	const dynamicLeftMargin =
		TICK_LENGTH + TICK_LABEL_PADDING + maxTickLabelWidth + AXIS_TITLE_PADDING + wrappedTitleHeight / 2 + PADDING

	// Calculate title height if it exists
	// const titleHeight = 0 // Unused variable

	// Define margins to create space for labels and ticks (titles float outside)
	const margin = {
		top: 40,
		right: PADDING,
		bottom: 40,
		left: dynamicLeftMargin
	}
	const chartWidth = width - margin.left - margin.right
	const chartHeight = height - margin.top - margin.bottom

	const scaleX = chartWidth / (xAxis.max - xAxis.min)
	const scaleY = chartHeight / (yAxis.max - yAxis.min)

	const toSvgX = (val: number) => margin.left + (val - xAxis.min) * scaleX
	const toSvgY = (val: number) => height - margin.bottom - (val - yAxis.min) * scaleY

	const zeroX = toSvgX(0)
	const zeroY = toSvgY(0)

	const chartArea = {
		left: margin.left,
		top: margin.top,
		width: chartWidth,
		height: chartHeight
	}

	// ADD THIS BLOCK: Render title if it exists
	if (title) {
		drawChartTitle(canvas, chartArea, title, { maxWidthPolicy: "frame" })
	}

	// Add a clipping path definition that other elements can reference.
	canvas.addDef(
		`<clipPath id="${canvas.clipId}"><rect x="${chartArea.left}" y="${chartArea.top}" width="${chartArea.width}" height="${chartArea.height}"/></clipPath>`
	)

	// Grid lines
	if (xAxis.showGridLines) {
		const { values } = buildTicks(xAxis.min, xAxis.max, xAxis.tickInterval)
		for (const t of values) {
			if (Math.abs(t) < 1e-9) continue // Skip origin
			const x = toSvgX(t)
			canvas.drawLine(x, margin.top, x, height - margin.bottom, {
				stroke: theme.colors.gridMajor,
				strokeWidth: 1
			})
		}
	}
	if (yAxis.showGridLines) {
		const { values } = buildTicks(yAxis.min, yAxis.max, yAxis.tickInterval)
		for (const t of values) {
			if (Math.abs(t) < 1e-9) continue // Skip origin
			const y = toSvgY(t)
			canvas.drawLine(margin.left, y, width - margin.right, y, {
				stroke: theme.colors.gridMajor,
				strokeWidth: 1
			})
		}
	}

	// Axes lines
	canvas.drawLine(margin.left, zeroY, width - margin.right, zeroY, {
		stroke: theme.colors.axis,
		strokeWidth: 1.5
	})
	canvas.drawLine(zeroX, margin.top, zeroX, height - margin.bottom, {
		stroke: theme.colors.axis,
		strokeWidth: 1.5
	})

	// X-axis ticks and labels
	const { values: xValues, labels: xLabels } = buildTicks(xAxis.min, xAxis.max, xAxis.tickInterval)
	const xTickPositions = xValues.map(toSvgX)

	const selectedXTicks = selectAxisLabels({
		labels: xLabels,
		positions: xTickPositions,
		axisLengthPx: chartWidth,
		orientation: "horizontal",
		fontPx: TICK_LABEL_FONT_PX,
		minGapPx: X_AXIS_MIN_LABEL_PADDING_PX
	})
	xValues.forEach((t, i) => {
		if (Math.abs(t) < 1e-9) return // Skip origin
		const x = toSvgX(t)
		canvas.drawLine(x, zeroY - 4, x, zeroY + 4, {
			stroke: theme.colors.axis,
			strokeWidth: 1
		})
		if (selectedXTicks.has(i)) {
			const label = xLabels[i]
			if (label !== undefined) {
				canvas.drawText({
					x: x,
					y: zeroY + 15,
					text: label,
					fill: theme.colors.axisLabel,
					anchor: "middle",
					fontPx: TICK_LABEL_FONT_PX
				})
			}
		}
	})

	// Y-axis ticks and labels
	const { values: yValues, labels: yLabels } = buildTicks(yAxis.min, yAxis.max, yAxis.tickInterval)
	const yTickPositions = yValues.map(toSvgY)

	const selectedYTicks = selectAxisLabels({
		labels: yLabels,
		positions: yTickPositions,
		axisLengthPx: chartHeight,
		orientation: "vertical",
		fontPx: TICK_LABEL_FONT_PX,
		minGapPx: Y_AXIS_MIN_LABEL_GAP_PX
	})
	yValues.forEach((t, i) => {
		if (Math.abs(t) < 1e-9) return // Skip origin
		const y = toSvgY(t)
		canvas.drawLine(zeroX - 4, y, zeroX + 4, y, {
			stroke: theme.colors.axis,
			strokeWidth: 1
		})
		if (selectedYTicks.has(i)) {
			const label = yLabels[i]
			if (label !== undefined) {
				canvas.drawText({
					x: zeroX - 8,
					y: y + 4,
					text: label,
					fill: theme.colors.axisLabel,
					anchor: "end",
					fontPx: TICK_LABEL_FONT_PX
				})
			}
		}
	})

	// Axis labels
	canvas.drawText({
		x: margin.left + chartWidth / 2,
		y: height - 5,
		text: abbreviateMonth(xAxis.label),
		anchor: "middle",
		fill: theme.colors.axisLabel,
		fontPx: 14
	})

	// ADD new dynamic and wrapped axis label logic
	const yAxisTitleX =
		margin.left - (AXIS_TITLE_PADDING + maxTickLabelWidth + TICK_LABEL_PADDING + TICK_LENGTH + wrappedTitleHeight / 2)
	const yAxisTitleY = margin.top + chartHeight / 2
	canvas.drawWrappedText({
		x: yAxisTitleX,
		y: yAxisTitleY,
		text: abbreviateMonth(yAxis.label),
		maxWidthPx: chartHeight,
		anchor: "middle",
		fill: theme.colors.axisLabel,
		fontPx: 14,
		rotate: { angle: -90, cx: yAxisTitleX, cy: yAxisTitleY }
	})

	// Quadrant labels
	if (showQuadrantLabels) {
		const hasPositiveX = xAxis.max > 0
		const hasNegativeX = xAxis.min < 0
		const hasPositiveY = yAxis.max > 0
		const hasNegativeY = yAxis.min < 0

		const qLabelStyle = {
			fill: "#ccc",
			fontPx: 18,
			anchor: "middle" as const,
			dominantBaseline: "middle" as const
		}

		// Clamp the zero anchor to chart edges so labels stay inside the chart area
		const anchorXPos = Math.min(Math.max(zeroX, chartArea.left), chartArea.left + chartArea.width)
		const anchorYPos = Math.min(Math.max(zeroY, chartArea.top), chartArea.top + chartArea.height)

		// I: (+x, +y)
		if (hasPositiveX && hasPositiveY) {
			canvas.drawText({
				x: anchorXPos + chartWidth / 4,
				y: anchorYPos - chartHeight / 4,
				text: "I",
				...qLabelStyle
			})
		}
		// II: (-x, +y)
		if (hasNegativeX && hasPositiveY) {
			canvas.drawText({
				x: anchorXPos - chartWidth / 4,
				y: anchorYPos - chartHeight / 4,
				text: "II",
				...qLabelStyle
			})
		}
		// III: (-x, -y)
		if (hasNegativeX && hasNegativeY) {
			canvas.drawText({
				x: anchorXPos - chartWidth / 4,
				y: anchorYPos + chartHeight / 4,
				text: "III",
				...qLabelStyle
			})
		}
		// IV: (+x, -y)
		if (hasPositiveX && hasNegativeY) {
			canvas.drawText({
				x: anchorXPos + chartWidth / 4,
				y: anchorYPos + chartHeight / 4,
				text: "IV",
				...qLabelStyle
			})
		}
	}

	return { toSvgX, toSvgY, chartArea }
}
