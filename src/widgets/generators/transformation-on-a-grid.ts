import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

const PointSchema = z
	.object({
		x: z.number().describe("Horizontal coordinate in grid units. Can be integers or decimals. Examples: 0, 1.5, -2, 4.25. Grid origin (0,0) is at bottom-left corner."),
		y: z.number().describe("Vertical coordinate in grid units. Can be integers or decimals. Examples: 0, 2.5, -1, 3.75. Positive y values go upward from the origin."),
		label: z.string().nullable().describe("Optional text label for this vertex. Examples: 'A', 'B', 'C', 'P₁', 'vertex'. Set to null for unlabeled vertices. Labels are positioned outside the polygon for clarity.")
			.transform((val) => (val === "null" || val === "NULL" || val === "" ? null : val))
	})
	.strict()

const PolygonSchema = z
	.object({
		id: z.string().describe("Unique identifier for this polygon. Examples: 'original', 'transformed', 'triangle_ABC', 'figure_1'. Used for referencing and distinguishing multiple polygons."),
		points: z.array(PointSchema).min(3).describe("Array of vertices defining the polygon boundary. Minimum 3 points required. Points should be ordered (clockwise or counter-clockwise) to form a proper polygon. Examples: triangle (3 points), rectangle (4 points), pentagon (5 points)."),
		fillColor: z
			.string()
			.regex(CSS_COLOR_PATTERN)
			.nullable()
			.describe("CSS fill color for the polygon interior. Examples: '#FFE5CC' (light orange), 'rgba(255,0,0,0.3)' (semi-transparent red), 'transparent' (no fill). Set to null for transparent fill."),
		strokeColor: z.string().regex(CSS_COLOR_PATTERN).describe("CSS color for the polygon outline. Examples: '#FF0000' (red), '#0066CC' (blue), '#000000' (black). Should contrast with fill color and background."),
		label: z
			.string()
			.nullable()
			.transform((val) => (val === "null" || val === "NULL" || val === "" ? null : val))
			.describe("Optional label for the entire polygon. Examples: 'Figure 1', 'Original', 'Image', 'Triangle ABC'. Set to null for unlabeled polygons. Label appears below the polygon.")
	})
	.strict()

export const TransformationOnAGridPropsSchema = z
	.object({
		type: z.literal("transformationOnAGrid"),
		width: z.number().int().min(1).describe("SVG canvas width in pixels. Recommended range: 400-800px for clear visualization of transformations and adequate space for labels."),
		height: z.number().int().min(1).describe("SVG canvas height in pixels. Recommended range: 400-800px. Usually equal to width for square grids, but can be adjusted for rectangular grids."),
		grid: z
			.object({
				rows: z.number().int().min(1).describe("Number of horizontal grid rows. Determines the vertical extent of the coordinate system. Examples: 10 for a 10-unit tall grid, 20 for more detailed work."),
				columns: z.number().int().min(1).describe("Number of vertical grid columns. Determines the horizontal extent of the coordinate system. Examples: 10 for a 10-unit wide grid, 15 for rectangular grids."),
				tickStep: z.number().min(0.1).default(1).describe("Spacing between grid lines in grid units. Examples: 1 (unit grid), 0.5 (half-unit subdivisions), 2 (every other unit). Smaller values create denser grids.")
			})
			.strict()
			.describe("Grid configuration defining the coordinate system background. Creates a rectangular grid with specified dimensions and line spacing."),
		polygons: z.array(PolygonSchema).min(1).describe("Array of polygons to display on the grid. Typically includes original figures and their transformations (rotations, reflections, translations, dilations). Each polygon can have different colors and labels for comparison.")
	})
	.strict()
	.describe(
		"Creates geometric transformation diagrams on coordinate grids. Perfect for showing reflections, rotations, translations, and dilations of polygons. Features automatic vertex labeling, smart label positioning, and support for multiple overlaid figures with different colors. Essential for transformation geometry lessons."
	)

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
