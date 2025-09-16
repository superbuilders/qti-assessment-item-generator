import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

const PointSchema = z
	.object({
		x: z.number().describe("The x-coordinate of the point in grid units."),
		y: z.number().describe("The y-coordinate of the point in grid units."),
		label: z.string().nullable().describe("An optional label for the vertex (e.g., 'A', 'B').")
	})
	.strict()

const PolygonSchema = z
	.object({
		id: z.string().describe("A unique identifier for the polygon."),
		points: z.array(PointSchema).min(3).describe("An array of vertices that define the polygon."),
		fillColor: z
			.string()
			.regex(CSS_COLOR_PATTERN)
			.nullable()
			.describe("The fill color of the polygon. Use a transparent color for no fill."),
		strokeColor: z.string().regex(CSS_COLOR_PATTERN).describe("The stroke (outline) color of the polygon."),
		label: z.string().nullable().describe("An optional label for the entire figure (e.g., 'Figure 1').")
	})
	.strict()

export const TransformationOnAGridPropsSchema = z
	.object({
		type: z.literal("transformationOnAGrid"),
		width: z.number().int().min(1).describe("The total width of the SVG canvas in pixels."),
		height: z.number().int().min(1).describe("The total height of the SVG canvas in pixels."),
		grid: z
			.object({
				rows: z.number().int().min(1).describe("The number of rows in the grid."),
				columns: z.number().int().min(1).describe("The number of columns in the grid."),
				tickStep: z.number().min(0.1).default(1).describe("The distance between grid lines in grid units.")
			})
			.strict()
			.describe("Configuration for the grid background with explicit dimensions."),
		polygons: z.array(PolygonSchema).min(1).describe("An array of polygons to render on the grid.")
	})
	.strict()

export type TransformationOnAGridProps = z.infer<typeof TransformationOnAGridPropsSchema>

export const generateTransformationOnAGrid: WidgetGenerator<typeof TransformationOnAGridPropsSchema> = async (data) => {
	const { width, height, grid, polygons } = data

	// Use explicit grid dimensions
	const minX = 0
	const maxX = grid.columns
	const minY = 0
	const maxY = grid.rows

	const gridRangeX = maxX - minX
	const gridRangeY = maxY - minY

	const canvas = new CanvasImpl({
		fontPxDefault: 12,
		lineHeightDefault: 1.2,
		chartArea: { top: PADDING, left: PADDING, width: width - 2 * PADDING, height: height - 2 * PADDING }
	})

	const scaleX = (width - 2 * PADDING) / gridRangeX
	const scaleY = (height - 2 * PADDING) / gridRangeY
	const scale = Math.min(scaleX, scaleY)

	const toSvgX = (x: number) => PADDING + (x - minX) * scale
	const toSvgY = (y: number) => PADDING + (maxY - y) * scale // Y is inverted in SVG

	// Draw grid lines
	for (let x = Math.ceil(minX / grid.tickStep) * grid.tickStep; x <= maxX; x += grid.tickStep) {
		canvas.drawLine(toSvgX(x), toSvgY(minY), toSvgX(x), toSvgY(maxY), {
			stroke: theme.colors.gridMajor,
			strokeWidth: 1
		})
	}
	for (let y = Math.ceil(minY / grid.tickStep) * grid.tickStep; y <= maxY; y += grid.tickStep) {
		canvas.drawLine(toSvgX(minX), toSvgY(y), toSvgX(maxX), toSvgY(y), {
			stroke: theme.colors.gridMajor,
			strokeWidth: 1
		})
	}

	// Helper function to calculate polygon centroid
	const calculateCentroid = (points: { x: number; y: number }[]) => {
		const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
		return { x: sum.x / points.length, y: sum.y / points.length }
	}

	// Helper function to get polygon bounding box
	const getBoundingBox = (points: { x: number; y: number }[]) => {
		const xs = points.map((p) => p.x)
		const ys = points.map((p) => p.y)
		return {
			minX: Math.min(...xs),
			maxX: Math.max(...xs),
			minY: Math.min(...ys),
			maxY: Math.max(...ys)
		}
	}

	// Helper function to find best label position outside polygon
	const findBestLabelPosition = (pointX: number, pointY: number, centroid: { x: number; y: number }) => {
		const labelOffset = 0.3 // Distance from point in grid units

		// Calculate direction away from centroid
		const dx = pointX - centroid.x
		const dy = pointY - centroid.y
		const length = Math.sqrt(dx * dx + dy * dy)

		if (length === 0) {
			// If point is at centroid, default to top-left
			return { x: pointX - labelOffset, y: pointY - labelOffset }
		}

		// Normalize direction and apply offset
		const normalizedDx = dx / length
		const normalizedDy = dy / length

		return {
			x: pointX + normalizedDx * labelOffset,
			y: pointY + normalizedDy * labelOffset
		}
	}

	// Draw polygons and labels
	for (const poly of polygons) {
		const svgPoints = poly.points.map((p) => ({ x: toSvgX(p.x), y: toSvgY(p.y) }))
		const gridPoints = poly.points.map((p) => ({ x: p.x, y: p.y }))

		canvas.drawPolygon(svgPoints, {
			fill: poly.fillColor ?? "transparent",
			stroke: poly.strokeColor,
			strokeWidth: 2
		})

		// Calculate polygon properties for smart label positioning
		const centroid = calculateCentroid(gridPoints)
		const boundingBox = getBoundingBox(gridPoints)

		// Draw vertex labels with smart positioning
		for (const p of poly.points) {
			if (p.label) {
				const labelPos = findBestLabelPosition(p.x, p.y, centroid)
				canvas.drawText({
					x: toSvgX(labelPos.x),
					y: toSvgY(labelPos.y),
					text: p.label,
					fill: theme.colors.text,
					fontWeight: theme.font.weight.bold
				})
			}
		}

		// Draw figure label below the polygon
		if (poly.label) {
			const figureX = centroid.x
			const figureY = boundingBox.maxY + 1 // Place 1 unit below the bottom of the polygon
			canvas.drawText({
				x: toSvgX(figureX),
				y: toSvgY(figureY),
				text: poly.label,
				fill: theme.colors.textSecondary
			})
		}
	}

	const { svgBody } = canvas.finalize(0)
	return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgBody}</svg>`
}
