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

// A simple, safe regex for identifiers.
const identifierRegex = /^[A-Za-z0-9_]+$/

/**
 * Defines a structured label for dimensions, separating the numeric or variable
 * value from its unit for clear, consistent rendering.
 *
 * Factory pattern to avoid shared Zod instances which cause $ref generation.
 */
function createLabelSchema() {
	return z
		.object({
			value: z
				.union([z.number(), z.string()])
				.describe(
					"Numerical value or algebraic variable for the dimension label. Examples: 10, 7.5, 'x', '2y+3'. Use strings for variables or expressions."
				),
			unit: z
				.string()
				.nullable()
				.describe(
					"Measurement unit for the value. Common units: 'cm', 'in', 'm', 'ft', 'mm'. Set to null when no unit applies (pure numbers, ratios, or when unit is contextually understood)."
				)
		})
		.strict()
		.nullable()
}

/**
 * Defines a single vertex with a unique ID and coordinates.
 * This is the single source of truth for all points in the diagram.
 *
 * Factory to prevent $ref generation.
 */
function createVertexSchema() {
	return z
		.object({
			id: z
				.string()
				.regex(identifierRegex)
				.describe(
					"Unique identifier for this vertex point. Use descriptive names like 'A', 'B', 'topLeft', 'center', 'midpoint1'. This ID is referenced throughout the schema to define edges, regions, and markers."
				),
			x: z
				.number()
				.describe(
					"Horizontal position in the diagram's coordinate system. Use any convenient scale - the diagram auto-centers and scales to fit the canvas. Positive values go rightward from the origin."
				),
			y: z
				.number()
				.describe(
					"Vertical position in the diagram's coordinate system. Positive values go downward from the origin, following standard screen/SVG conventions."
				)
		})
		.strict()
}

/**
 * Describes a single, labeled segment that is part of a larger partitioned edge.
 * This is the building block for creating boundaries with multiple labels.
 *
 * Factory to prevent $ref generation.
 */
function createPartitionedSegmentSchema() {
	return z
		.object({
			label: createLabelSchema().describe(
				"Dimension label for this segment portion. Set to null for unlabeled segments. Each segment in a partitioned edge can have its own measurement or variable."
			),
			style: z
				.enum(["solid", "dashed"])
				.describe(
					"Line style for this segment. Use 'solid' for measured/known dimensions and 'dashed' for construction lines, unknown measurements, or auxiliary segments."
				)
		})
		.strict()
}

/**
 * A discriminated union to explicitly define a boundary edge.
 * An edge can either be a simple line between two vertices or a
 * complex path composed of multiple, individually labeled segments.
 *
 * Factory to prevent $ref generation.
 */
function createBoundaryEdgeSchema() {
	return z.discriminatedUnion("type", [
		z
			.object({
				type: z.literal("simple").describe("Single straight line edge connecting two vertices directly."),
				from: z
					.string()
					.regex(identifierRegex)
					.describe("Starting vertex ID for this edge. Must reference a valid vertex ID from the vertices array."),
				to: z
					.string()
					.regex(identifierRegex)
					.describe("Ending vertex ID for this edge. Must reference a valid vertex ID from the vertices array."),
				label: createLabelSchema().describe(
					"Measurement label for the entire edge length. Set to null for unlabeled edges."
				)
			})
			.strict(),
		z
			.object({
				type: z.literal("partitioned").describe("Multi-segment edge path with individual labels for each segment."),
				path: z
					.array(z.string().regex(identifierRegex))
					.min(3)
					.describe(
						"Ordered sequence of vertex IDs forming the edge path. Example: ['A', 'midpoint', 'B'] creates two segments. Minimum 3 vertices required."
					),
				segments: z
					.array(createPartitionedSegmentSchema())
					.describe(
						"Segment definitions for each path section. Array length must equal path.length - 1. Each segment can have its own label and style."
					)
			})
			.strict()
	])
}

/**
 * Defines a line segment that is *internal* to the shape, used for decomposition.
 *
 * Factory to prevent $ref generation.
 */
function createInternalSegmentSchema() {
	return z
		.object({
			fromVertexId: z
				.string()
				.regex(identifierRegex)
				.describe("Starting vertex ID for the internal line segment. Must reference a vertex from the vertices array."),
			toVertexId: z
				.string()
				.regex(identifierRegex)
				.describe("Ending vertex ID for the internal line segment. Must reference a vertex from the vertices array."),
			style: z
				.enum(["solid", "dashed"])
				.describe(
					"Line appearance. Use 'solid' for structural divisions and 'dashed' for construction lines, heights, or auxiliary measurements."
				),
			label: createLabelSchema().describe(
				"Measurement or name label for this internal segment. Set to null for construction lines without labels."
			)
		})
		.strict()
}

/**
 * Defines a shaded polygonal region within the composite shape.
 *
 * Factory to prevent $ref generation.
 */
function createShadedRegionSchema() {
	return z
		.object({
			vertexIds: z
				.array(z.string().regex(identifierRegex))
				.min(3)
				.describe(
					"Ordered list of vertex IDs forming the polygon boundary for shading. Vertices should be listed in clockwise or counter-clockwise order. Minimum 3 vertices required."
				),
			fillColor: z
				.string()
				.regex(CSS_COLOR_PATTERN)
				.describe(
					"CSS color value for the shaded region. Examples: '#FFE5CC' (hex), 'rgba(255,229,204,0.5)' (with transparency), 'lightblue' (named color). Use rgba with alpha < 1.0 for semi-transparent overlays."
				)
		})
		.strict()
}

/**
 * Defines a text label placed at an arbitrary position inside a region.
 *
 * Factory to prevent $ref generation.
 */
function createRegionLabelSchema() {
	return z
		.object({
			text: z
				.string()
				.describe(
					"Text content for the region label. Examples: 'Region A', '45 cm²', 'Area = 12x', 'Triangle ABC'. Use for area calculations, region names, or mathematical expressions."
				),
			position: z
				.object({
					x: z
						.number()
						.describe(
							"Horizontal coordinate for label placement, using the same coordinate system as vertices. Position should be inside the intended region."
						),
					y: z
						.number()
						.describe(
							"Vertical coordinate for label placement, using the same coordinate system as vertices. Positive y goes downward."
						)
				})
				.strict()
		})
		.strict()
}

/**
 * Defines a right-angle marker at a vertex.
 *
 * Factory to prevent $ref generation.
 */
function createRightAngleMarkerSchema() {
	return z
		.object({
			cornerVertexId: z
				.string()
				.regex(identifierRegex)
				.describe(
					"Vertex ID where the 90° angle is located. This is the corner vertex where the right angle marker will be drawn."
				),
			adjacentVertex1Id: z
				.string()
				.regex(identifierRegex)
				.describe(
					"ID of the first vertex connected to the corner, forming one side of the right angle. Must be connected to cornerVertexId by an edge."
				),
			adjacentVertex2Id: z
				.string()
				.regex(identifierRegex)
				.describe(
					"ID of the second vertex connected to the corner, forming the other side of the right angle. Must be connected to cornerVertexId by an edge."
				)
		})
		.strict()
}

/**
 * Creates complex composite polygons with internal divisions, shaded regions, and geometric annotations.
 * This API is designed to be explicit and robust, defining the shape's perimeter as a collection of `boundaryEdges`.
 * This approach avoids ambiguity and allows for clear, semantically correct definitions of complex boundaries with multiple labels.
 */
export const CompositeShapeDiagramPropsSchema = z
	.object({
		type: z
			.literal("compositeShapeDiagram")
			.describe("Widget type identifier for composite shape diagrams with complex polygons and annotations."),
		width: z
			.number()
			.positive()
			.describe(
				"SVG canvas width in pixels. The diagram automatically centers and scales to fit within this width while maintaining aspect ratio. Recommended: 400-800px."
			),
		height: z
			.number()
			.positive()
			.describe(
				"SVG canvas height in pixels. The diagram automatically centers and scales to fit within this height while maintaining aspect ratio. Recommended: 300-600px."
			),
		vertices: z
			.array(createVertexSchema())
			.describe(
				"Complete list of all vertex points defining the shape geometry. Each vertex needs a unique ID for referencing in edges, regions, and markers. Define vertices in logical coordinates - scaling is automatic."
			),

		boundaryEdges: z
			.array(createBoundaryEdgeSchema())
			.describe(
				"Ordered sequence of edges forming the shape's outer perimeter. Each edge connects vertices and can have measurement labels. Use simple edges for single measurements or partitioned edges for multi-segment boundaries."
			),

		internalSegments: z
			.array(createInternalSegmentSchema())
			.nullable()
			.describe(
				"Optional internal line segments for shape decomposition and analysis. Common uses: heights, medians, diagonals, construction lines. These appear inside the boundary and can show measurements or structural divisions."
			),

		shadedRegions: z
			.array(createShadedRegionSchema())
			.nullable()
			.describe(
				"Optional colored regions within the shape. Define polygonal areas by listing vertex IDs in order. Useful for highlighting specific areas, showing different materials, or visual emphasis."
			),

		regionLabels: z
			.array(createRegionLabelSchema())
			.nullable()
			.describe(
				"Optional text labels placed at specific coordinates within regions. Use for area calculations, region names, formulas, or annotations that need precise positioning."
			),

		rightAngleMarkers: z
			.array(createRightAngleMarkerSchema())
			.nullable()
			.describe(
				"Optional 90° angle indicators drawn as small squares at vertices. Specify the corner vertex and its two adjacent vertices to show perpendicular relationships."
			)
	})
	.strict()

export type CompositeShapeDiagramProps = z.infer<typeof CompositeShapeDiagramPropsSchema>
type Point = { x: number; y: number }
type Label = z.infer<ReturnType<typeof createLabelSchema>>

// Helper function to format the label object into a display string.
const formatLabel = (label: Label): string | null => {
	if (!label) return null
	if (label.unit) {
		return `${label.value} ${label.unit}`
	}
	return String(label.value)
}

/**
 * Generates a diagram of a composite polygon from a set of vertices. Ideal for area
 * problems involving the decomposition of a complex shape into simpler figures.
 */
export const generateCompositeShapeDiagram: WidgetGenerator<typeof CompositeShapeDiagramPropsSchema> = async (data) => {
	const {
		width,
		height,
		vertices,
		boundaryEdges,
		internalSegments = [],
		shadedRegions = [],
		regionLabels = [],
		rightAngleMarkers = []
	} = data

	if (vertices.length === 0) {
		return `<svg width="${width}" height="${height}" />`
	}

	const vertexMap = new Map(vertices.map((v) => [v.id, { x: v.x, y: v.y }]))

	// --- Data Validation ---
	for (const edge of boundaryEdges) {
		if (edge.type === "partitioned") {
			if (edge.segments.length !== edge.path.length - 1) {
				logger.error("Partitioned edge segment/path mismatch", {
					pathCount: edge.path.length,
					segmentCount: edge.segments.length
				})
				throw errors.new(
					`For a partitioned edge, segments length (${edge.segments.length}) must be one less than path length (${edge.path.length}).`
				)
			}
		}
	}
	// --- End Validation ---

	// Fit-to-canvas projection (uniform scale + centering)
	const allPoints: Point[] = [
		...vertices.map((v) => ({ x: v.x, y: v.y })),
		...(regionLabels || []).map((l) => ({ x: l.position.x, y: l.position.y }))
	]

	const computeFit = (points: Point[]) => {
		if (points.length === 0) return { scale: 1, project: (p: Point) => p }
		const minX = Math.min(...points.map((p) => p.x))
		const maxX = Math.max(...points.map((p) => p.x))
		const minY = Math.min(...points.map((p) => p.y))
		const maxY = Math.max(...points.map((p) => p.y))
		const rawW = maxX - minX
		const rawH = maxY - minY
		const scale = Math.min((width - 2 * PADDING) / (rawW || 1), (height - 2 * PADDING) / (rawH || 1))
		const offsetX = (width - scale * rawW) / 2 - scale * minX
		const offsetY = (height - scale * rawH) / 2 - scale * minY
		const project = (p: Point) => ({
			x: offsetX + scale * p.x,
			y: offsetY + scale * p.y
		})
		return { scale, project }
	}

	const { scale, project } = computeFit(allPoints)
	const canvas = new CanvasImpl({
		chartArea: { left: 0, top: 0, width, height },
		fontPxDefault: 12,
		lineHeightDefault: 1.2
	})

	// 1. Shaded regions (drawn first)
	for (const region of shadedRegions || []) {
		const regionPoints = region.vertexIds
			.map((id) => vertexMap.get(id))
			.filter((p): p is Point => !!p)
			.map(project)
		if (regionPoints.length >= 3) {
			canvas.drawPolygon(regionPoints, {
				fill: region.fillColor,
				stroke: "none"
			})
		}
	}

	// 2. Main shape boundary and its labels
	const outerBoundaryPath = new Path2D()
	const transformedPerimeter: Array<{ x: number; y: number }> = []
	for (const [index, edge] of boundaryEdges.entries()) {
		if (edge.type === "simple") {
			const from = vertexMap.get(edge.from)
			const to = vertexMap.get(edge.to)
			if (!from || !to) continue

			const pFrom = project(from)
			if (index === 0) {
				outerBoundaryPath.moveTo(pFrom.x, pFrom.y)
				transformedPerimeter.push(pFrom)
			}
			const pTo = project(to)
			outerBoundaryPath.lineTo(pTo.x, pTo.y)
			transformedPerimeter.push(pTo)
		} else {
			// Partitioned edge
			const pathPoints = edge.path.map((id) => vertexMap.get(id)).filter((p): p is Point => !!p)
			if (pathPoints.length < 2) continue

			if (index === 0 && pathPoints[0]) {
				const first = project(pathPoints[0])
				outerBoundaryPath.moveTo(first.x, first.y)
				transformedPerimeter.push(first)
			}
			for (let i = 1; i < pathPoints.length; i++) {
				const point = pathPoints[i]
				if (point) {
					const pt = project(point)
					outerBoundaryPath.lineTo(pt.x, pt.y)
					transformedPerimeter.push(pt)
				}
			}

			for (let i = 0; i < edge.segments.length; i++) {
				const from = pathPoints[i]
				const to = pathPoints[i + 1]
				const segment = edge.segments[i]
				if (!from || !to || !segment) continue

				const p1 = project(from)
				const p2 = project(to)
				const dash = segment.style === "dashed" ? "4 2" : undefined
				canvas.drawLine(p1.x, p1.y, p2.x, p2.y, {
					stroke: theme.colors.black,
					strokeWidth: theme.stroke.width.base,
					dash
				})
			}
		}
	}
	canvas.drawPath(outerBoundaryPath.closePath(), {
		fill: "none",
		stroke: theme.colors.black,
		strokeWidth: theme.stroke.width.thick
	})

	// Build perimeter segments for collision checks
	const perimeterSegments: Array<{
		a: { x: number; y: number }
		b: { x: number; y: number }
	}> = []
	for (let i = 0; i < transformedPerimeter.length; i++) {
		const a = transformedPerimeter[i]
		const b = transformedPerimeter[(i + 1) % transformedPerimeter.length]
		if (a && b) perimeterSegments.push({ a, b })
	}

	// 2b. Boundary simple-edge labels with collision avoidance
	for (const edge of boundaryEdges) {
		if (edge.type !== "simple") continue
		const from = vertexMap.get(edge.from)
		const to = vertexMap.get(edge.to)
		if (!from || !to) continue
		const labelText = formatLabel(edge.label)
		if (!labelText) continue
		const sFrom = project(from)
		const sTo = project(to)
		const midX = (sFrom.x + sTo.x) / 2
		const midY = (sFrom.y + sTo.y) / 2
		const dx = sTo.x - sFrom.x
		const dy = sTo.y - sFrom.y
		const len = Math.hypot(dx, dy)
		if (len === 0) continue
		let nx = -dy / len
		let ny = dx / len
		const polyCenterX = transformedPerimeter.reduce((sum, v) => sum + v.x, 0) / Math.max(transformedPerimeter.length, 1)
		const polyCenterY = transformedPerimeter.reduce((sum, v) => sum + v.y, 0) / Math.max(transformedPerimeter.length, 1)
		const toCenterX = polyCenterX - midX
		const toCenterY = polyCenterY - midY
		const dot = nx * toCenterX + ny * toCenterY
		if (dot > 0) {
			nx = -nx
			ny = -ny
		}
		const fontPx = theme.font.size.medium
		const { maxWidth: w, height: h } = estimateWrappedTextDimensions(labelText, Number.POSITIVE_INFINITY, fontPx, 1.2)
		const halfW = w / 2
		const halfH = h / 2
		const baseOffsetPx = 12
		function placeFor(dirX: number, dirY: number) {
			let px = midX + dirX * baseOffsetPx
			let py = midY + dirY * baseOffsetPx
			let it = 0
			const maxIt = 60
			const step = 2
			while (
				polygonIntersectsRect(transformedPerimeter, {
					x: px - halfW,
					y: py - halfH,
					width: w,
					height: h,
					pad: 1
				}) &&
				it < maxIt
			) {
				px += dirX * step
				py += dirY * step
				it++
			}
			return { x: px, y: py, it }
		}
		const outward = placeFor(nx, ny)
		const inward = placeFor(-nx, -ny)
		const chosen = inward.it < outward.it ? inward : outward
		canvas.drawText({
			x: chosen.x,
			y: chosen.y,
			text: labelText,
			fill: theme.colors.text,
			anchor: "middle",
			dominantBaseline: "middle",
			fontPx,
			fontWeight: theme.font.weight.bold
		})
	}

	// 2c. Partitioned segment labels with collision avoidance
	for (const edge of boundaryEdges) {
		if (edge.type !== "partitioned") continue
		const pathPoints = edge.path.map((id) => vertexMap.get(id)).filter((p): p is Point => !!p)
		for (let i = 0; i < edge.segments.length; i++) {
			const from = pathPoints[i]
			const to = pathPoints[i + 1]
			if (!from || !to) continue
			const labelText = formatLabel(edge.segments[i]?.label)
			if (!labelText) continue
			const sFrom = project(from)
			const sTo = project(to)
			const midX = (sFrom.x + sTo.x) / 2
			const midY = (sFrom.y + sTo.y) / 2
			const dx = sTo.x - sFrom.x
			const dy = sTo.y - sFrom.y
			const len = Math.hypot(dx, dy)
			if (len === 0) continue
			let nx = -dy / len
			let ny = dx / len
			const polyCenterX =
				transformedPerimeter.reduce((sum, v) => sum + v.x, 0) / Math.max(transformedPerimeter.length, 1)
			const polyCenterY =
				transformedPerimeter.reduce((sum, v) => sum + v.y, 0) / Math.max(transformedPerimeter.length, 1)
			const toCenterX = polyCenterX - midX
			const toCenterY = polyCenterY - midY
			const dot = nx * toCenterX + ny * toCenterY
			if (dot > 0) {
				nx = -nx
				ny = -ny
			}
			const fontPx = theme.font.size.base
			const { maxWidth: w, height: h } = estimateWrappedTextDimensions(labelText, Number.POSITIVE_INFINITY, fontPx, 1.2)
			const halfW = w / 2
			const halfH = h / 2
			const baseOffsetPx = 10
			function placeFor(dirX: number, dirY: number) {
				let px = midX + dirX * baseOffsetPx
				let py = midY + dirY * baseOffsetPx
				let it = 0
				const maxIt = 60
				const step = 2
				while (
					polygonIntersectsRect(transformedPerimeter, {
						x: px - halfW,
						y: py - halfH,
						width: w,
						height: h,
						pad: 1
					}) &&
					it < maxIt
				) {
					px += dirX * step
					py += dirY * step
					it++
				}
				return { x: px, y: py, it }
			}
			const outward = placeFor(nx, ny)
			const inward = placeFor(-nx, -ny)
			const chosen = inward.it < outward.it ? inward : outward
			canvas.drawText({
				x: chosen.x,
				y: chosen.y,
				text: labelText,
				fill: theme.colors.text,
				anchor: "middle",
				dominantBaseline: "middle",
				fontPx,
				stroke: theme.colors.background,
				strokeWidth: 3,
				paintOrder: "stroke fill"
			})
		}
	}

	// 3. Internal segments
	const internalSegmentsScreen: Array<{
		a: { x: number; y: number }
		b: { x: number; y: number }
		label: string | null
	}> = []
	for (const s of internalSegments || []) {
		const from = vertexMap.get(s.fromVertexId)
		const to = vertexMap.get(s.toVertexId)
		if (!from || !to) continue

		const p1 = project(from)
		const p2 = project(to)
		const dash = s.style === "dashed" ? "4 2" : undefined
		canvas.drawLine(p1.x, p1.y, p2.x, p2.y, {
			stroke: theme.colors.black,
			strokeWidth: theme.stroke.width.base,
			dash
		})
		internalSegmentsScreen.push({ a: p1, b: p2, label: formatLabel(s.label) })
	}

	// 3b. Internal segment labels with collision avoidance against all lines
	function rectIntersectsAnyLine(rect: { x: number; y: number; width: number; height: number; pad?: number }): boolean {
		for (const seg of perimeterSegments) {
			if (segmentIntersectsRect(seg.a, seg.b, rect)) return true
		}
		for (const seg of internalSegmentsScreen) {
			if (seg.label && segmentIntersectsRect(seg.a, seg.b, rect)) return true
		}
		return false
	}
	for (const seg of internalSegmentsScreen) {
		const labelText = seg.label
		if (!labelText) continue
		const sFrom = seg.a
		const sTo = seg.b
		const midX = (sFrom.x + sTo.x) / 2
		const midY = (sFrom.y + sTo.y) / 2
		const dx = sTo.x - sFrom.x
		const dy = sTo.y - sFrom.y
		const len = Math.hypot(dx, dy)
		if (len === 0) continue
		const nx = -dy / len
		const ny = dx / len
		const fontPx = theme.font.size.base
		const { maxWidth: w, height: h } = estimateWrappedTextDimensions(labelText, Number.POSITIVE_INFINITY, fontPx, 1.2)
		const halfW = w / 2
		const halfH = h / 2
		const baseOffsetPx = 8
		function placeFor(dirX: number, dirY: number) {
			let px = midX + dirX * baseOffsetPx
			let py = midY + dirY * baseOffsetPx
			let it = 0
			const maxIt = 60
			const step = 2
			while (
				rectIntersectsAnyLine({
					x: px - halfW,
					y: py - halfH,
					width: w,
					height: h,
					pad: 1
				}) &&
				it < maxIt
			) {
				px += dirX * step
				py += dirY * step
				it++
			}
			return { x: px, y: py, it }
		}
		const a = placeFor(nx, ny)
		const b = placeFor(-nx, -ny)
		const chosen = a.it <= b.it ? a : b
		canvas.drawText({
			x: chosen.x,
			y: chosen.y,
			text: labelText,
			fill: theme.colors.text,
			anchor: "middle",
			dominantBaseline: "middle",
			fontPx,
			stroke: theme.colors.background,
			strokeWidth: 3,
			paintOrder: "stroke fill"
		})
	}

	// 4. Region labels
	for (const l of regionLabels || []) {
		const pos0 = project({ x: l.position.x, y: l.position.y })
		const fontPx = theme.font.size.medium
		const { maxWidth: w, height: h } = estimateWrappedTextDimensions(l.text, Number.POSITIVE_INFINITY, fontPx, 1.2)
		const halfW = w / 2
		const halfH = h / 2

		function rectIntersectsAnyLine(rect: {
			x: number
			y: number
			width: number
			height: number
			pad?: number
		}): boolean {
			for (const seg of perimeterSegments) {
				if (segmentIntersectsRect(seg.a, seg.b, rect)) return true
			}
			for (const seg of internalSegmentsScreen) {
				if (segmentIntersectsRect(seg.a, seg.b, rect)) return true
			}
			return false
		}

		function nearestPointOnSegment(
			p: { x: number; y: number },
			a: { x: number; y: number },
			b: { x: number; y: number }
		) {
			const abx = b.x - a.x
			const aby = b.y - a.y
			const ab2 = abx * abx + aby * aby
			if (ab2 === 0) return { x: a.x, y: a.y }
			const apx = p.x - a.x
			const apy = p.y - a.y
			let t = (apx * abx + apy * aby) / ab2
			if (t < 0) t = 0
			if (t > 1) t = 1
			return { x: a.x + t * abx, y: a.y + t * aby }
		}

		function computeAwayDirection(px: number, py: number): { dx: number; dy: number } {
			let bestDist2 = Number.POSITIVE_INFINITY
			let nearest: {
				a: { x: number; y: number }
				b: { x: number; y: number }
			} | null = null
			for (const seg of perimeterSegments) {
				const q = nearestPointOnSegment({ x: px, y: py }, seg.a, seg.b)
				const dx = px - q.x
				const dy = py - q.y
				const d2 = dx * dx + dy * dy
				if (d2 < bestDist2) {
					bestDist2 = d2
					nearest = seg
				}
			}
			for (const seg of internalSegmentsScreen) {
				const q = nearestPointOnSegment({ x: px, y: py }, seg.a, seg.b)
				const dx = px - q.x
				const dy = py - q.y
				const d2 = dx * dx + dy * dy
				if (d2 < bestDist2) {
					bestDist2 = d2
					nearest = seg
				}
			}
			if (!nearest) return { dx: 0, dy: -1 }
			const q = nearestPointOnSegment({ x: px, y: py }, nearest.a, nearest.b)
			let dx = px - q.x
			let dy = py - q.y
			const len = Math.hypot(dx, dy)
			if (len === 0) return { dx: 0, dy: -1 }
			dx /= len
			dy /= len
			return { dx, dy }
		}

		function placeFor(dirX: number, dirY: number) {
			let px = pos0.x
			let py = pos0.y
			let it = 0
			const maxIt = 80
			const step = 2
			while (
				rectIntersectsAnyLine({
					x: px - halfW,
					y: py - halfH,
					width: w,
					height: h,
					pad: 1
				}) &&
				it < maxIt
			) {
				px += dirX * step
				py += dirY * step
				it++
				// keep the center inside the polygon
				if (!pointInPolygon({ x: px, y: py }, transformedPerimeter)) {
					it = maxIt + 1
					break
				}
			}
			return { x: px, y: py, it }
		}

		const away = computeAwayDirection(pos0.x, pos0.y)
		const a = placeFor(away.dx, away.dy)
		const b = placeFor(-away.dx, -away.dy)
		let chosen = a
		if (b.it < a.it) chosen = b
		if (chosen.it > 80) {
			// fallback attempt in axes if both failed within bounds
			const c = placeFor(0, -1)
			const d = placeFor(1, 0)
			const e = placeFor(0, 1)
			const f = placeFor(-1, 0)
			chosen = [a, b, c, d, e, f].reduce((best, cur) => (cur.it < best.it ? cur : best))
		}

		canvas.drawText({
			x: chosen.x,
			y: chosen.y,
			text: l.text,
			fill: theme.colors.text,
			anchor: "middle",
			dominantBaseline: "middle",
			fontPx,
			fontWeight: theme.font.weight.bold
		})
	}

	// 5. Right-angle markers
	for (const m of rightAngleMarkers || []) {
		const corner = vertexMap.get(m.cornerVertexId)
		const adj1 = vertexMap.get(m.adjacentVertex1Id)
		const adj2 = vertexMap.get(m.adjacentVertex2Id)
		if (!corner || !adj1 || !adj2) continue

		const v1x = adj1.x - corner.x
		const v1y = adj1.y - corner.y
		const mag1 = Math.hypot(v1x, v1y)
		if (mag1 === 0) continue
		const u1x = v1x / mag1
		const u1y = v1y / mag1

		const v2x = adj2.x - corner.x
		const v2y = adj2.y - corner.y
		const mag2 = Math.hypot(v2x, v2y)
		if (mag2 === 0) continue
		const u2x = v2x / mag2
		const u2y = v2y / mag2

		const markerSizePx = 10
		const markerSizeData = markerSizePx / scale
		const p1x = corner.x + u1x * markerSizeData
		const p1y = corner.y + u1y * markerSizeData
		const p2x = corner.x + u2x * markerSizeData
		const p2y = corner.y + u2y * markerSizeData
		const p3x = corner.x + (u1x + u2x) * markerSizeData
		const p3y = corner.y + (u1y + u2y) * markerSizeData

		const q1 = project({ x: p1x, y: p1y })
		const q2 = project({ x: p3x, y: p3y })
		const q3 = project({ x: p2x, y: p2y })
		const markerPath = new Path2D().moveTo(q1.x, q1.y).lineTo(q2.x, q2.y).lineTo(q3.x, q3.y)
		canvas.drawPath(markerPath, {
			fill: "none",
			stroke: theme.colors.black,
			strokeWidth: theme.stroke.width.base
		})
	}

	// Finalize and return SVG
	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)
	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}" font-size="${theme.font.size.small}">${svgBody}</svg>`
}

// Geometry helpers for collision checks in screen space
function segmentIntersectsRect(
	A: { x: number; y: number },
	B: { x: number; y: number },
	rect: { x: number; y: number; width: number; height: number; pad?: number }
): boolean {
	const pad = rect.pad ?? 0
	const rx = rect.x - pad
	const ry = rect.y - pad
	const rw = rect.width + 2 * pad
	const rh = rect.height + 2 * pad

	const minX = Math.min(A.x, B.x)
	const maxX = Math.max(A.x, B.x)
	const minY = Math.min(A.y, B.y)
	const maxY = Math.max(A.y, B.y)
	if (maxX < rx || minX > rx + rw || maxY < ry || minY > ry + rh) {
		return false
	}

	if (pointInRect(A.x, A.y, rx, ry, rw, rh) || pointInRect(B.x, B.y, rx, ry, rw, rh)) return true

	const r1 = { x: rx, y: ry }
	const r2 = { x: rx + rw, y: ry }
	const r3 = { x: rx + rw, y: ry + rh }
	const r4 = { x: rx, y: ry + rh }

	if (segmentsIntersect(A, B, r1, r2)) return true
	if (segmentsIntersect(A, B, r2, r3)) return true
	if (segmentsIntersect(A, B, r3, r4)) return true
	if (segmentsIntersect(A, B, r4, r1)) return true

	return false
}

function polygonIntersectsRect(
	poly: Array<{ x: number; y: number }>,
	rect: { x: number; y: number; width: number; height: number; pad?: number }
): boolean {
	if (poly.length < 2) return false
	const pad = rect.pad ?? 0
	const rx = rect.x - pad
	const ry = rect.y - pad
	const rw = rect.width + 2 * pad
	const rh = rect.height + 2 * pad

	for (let i = 0; i < poly.length; i++) {
		const a = poly[i]
		const b = poly[(i + 1) % poly.length]
		if (!a || !b) continue
		if (segmentIntersectsRect(a, b, { x: rx, y: ry, width: rw, height: rh })) return true
	}

	for (const p of poly) {
		if (pointInRect(p.x, p.y, rx, ry, rw, rh)) return true
	}

	const cx = rx + rw / 2
	const cy = ry + rh / 2
	if (pointInPolygon({ x: cx, y: cy }, poly)) return true

	return false
}

function pointInRect(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
	return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh
}

function segmentsIntersect(
	p1: { x: number; y: number },
	p2: { x: number; y: number },
	p3: { x: number; y: number },
	p4: { x: number; y: number }
): boolean {
	function orientation(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
		const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
		if (val > 0) return 1
		if (val < 0) return -1
		return 0
	}
	function onSegment(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): boolean {
		return (
			Math.min(a.x, c.x) <= b.x && b.x <= Math.max(a.x, c.x) && Math.min(a.y, c.y) <= b.y && b.y <= Math.max(a.y, c.y)
		)
	}
	const o1 = orientation(p1, p2, p3)
	const o2 = orientation(p1, p2, p4)
	const o3 = orientation(p3, p4, p1)
	const o4 = orientation(p3, p4, p2)

	if (o1 !== o2 && o3 !== o4) return true
	if (o1 === 0 && onSegment(p1, p3, p2)) return true
	if (o2 === 0 && onSegment(p1, p4, p2)) return true
	if (o3 === 0 && onSegment(p3, p1, p4)) return true
	if (o4 === 0 && onSegment(p3, p2, p4)) return true
	return false
}

function pointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>): boolean {
	if (polygon.length < 3) return false
	let inside = false
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const pi = polygon[i]
		const pj = polygon[j]
		if (!pi || !pj) continue
		const xi = pi.x
		const yi = pi.y
		const xj = pj.x
		const yj = pj.y
		const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
		if (intersect) inside = !inside
	}
	return inside
}
