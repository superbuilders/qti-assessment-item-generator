import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { Path2D } from "../../utils/path-builder"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

const CompositeShapePolygonSchema = z
	.object({
		id: z.string(),
		type: z.literal("polygon"),
		vertexIds: z.array(z.string()).min(3)
	})
	.strict()

const CompositeShapeCircleSchema = z
	.object({
		id: z.string(),
		type: z.literal("circle"),
		centerId: z.string(),
		radius: z.number().positive()
	})
	.strict()

const CompositeShapeSchema = z.discriminatedUnion("type", [CompositeShapePolygonSchema, CompositeShapeCircleSchema])

export const NestedShapeDiagramPropsSchema = z
	.object({
		type: z.literal("nestedShapeDiagram"),
		width: z.number().positive(),
		height: z.number().positive(),
		vertices: z.array(z.object({ id: z.string(), x: z.number(), y: z.number() }).strict()),
		shapes: z.array(CompositeShapeSchema),
		shadedRegions: z
			.array(
				z
					.object({
						fillColor: z.string().regex(CSS_COLOR_PATTERN),
						path: z.array(z.object({ shapeId: z.string(), pathType: z.enum(["outer", "inner"]) }).strict())
					})
					.strict()
			)
			.nullable(),
		internalSegments: z
			.array(
				z
					.object({
						fromVertexId: z.string(),
						toVertexId: z.string(),
						style: z.enum(["solid", "dashed"]),
						label: z
							.object({ value: z.number(), unit: z.string() })
							.strict()
							.nullable()
							.describe(
								"Label for this segment. Best practice: For height labels of inner rectangles within circles, place the label on the left edge to avoid clashing with radius labels."
							)
					})
					.strict()
			)
			.default([])
			.describe(
				"Internal line segments to draw. Radius lines and their labels are automatically rendered in red to distinguish them from other segments."
			),
		rightAngleMarkers: z.array(z.object({ vertexId: z.string(), size: z.number().positive() }).strict()).nullable()
	})
	.strict()

export type NestedShapeDiagramProps = z.infer<typeof NestedShapeDiagramPropsSchema>

export const generateNestedShapeDiagram: WidgetGenerator<typeof NestedShapeDiagramPropsSchema> = async (data) => {
	const { width, height, vertices, shapes, shadedRegions, internalSegments } = data
	if (vertices.length === 0) {
		logger.error("composite shape diagram: no vertices provided")
		throw errors.new("composite-shape: no vertices")
	}

	const vertexMap = new Map(vertices.map((v) => [v.id, v]))

	for (const shape of shapes) {
		if (shape.type === "polygon") {
			for (const vid of shape.vertexIds) {
				if (!vertexMap.has(vid)) {
					logger.error("polygon references missing vertex", { vertexId: vid, shapeId: shape.id })
					throw errors.new("composite-shape: polygon references missing vertex")
				}
			}
		} else {
			if (!vertexMap.has(shape.centerId)) {
				logger.error("circle references missing center vertex", { centerId: shape.centerId, shapeId: shape.id })
				throw errors.new("composite-shape: circle center missing")
			}
			if (!Number.isFinite(shape.radius) || shape.radius <= 0) {
				logger.error("invalid circle radius", { radius: shape.radius, shapeId: shape.id })
				throw errors.new("composite-shape: invalid circle radius")
			}
		}
	}

	const canvas = new CanvasImpl({
		chartArea: { top: 0, left: 0, width, height },
		fontPxDefault: theme.font.size.small,
		lineHeightDefault: 1.2
	})

	if (shadedRegions) {
		for (const region of shadedRegions) {
			const path = new Path2D()
			for (const part of region.path) {
				const shape = shapes.find((s) => s.id === part.shapeId)
				if (!shape) {
					logger.error("shaded region references unknown shape", { shapeId: part.shapeId })
					throw errors.new("composite-shape: shaded region unknown shape")
				}
				if (shape.type === "polygon") {
					const first = vertexMap.get(shape.vertexIds[0])
					if (!first) {
						logger.error("polygon shading missing first vertex", { shapeId: shape.id })
						throw errors.new("composite-shape: polygon missing vertex")
					}
					path.moveTo(first.x, first.y)
					for (let i = 1; i < shape.vertexIds.length; i++) {
						const p = vertexMap.get(shape.vertexIds[i])
						if (!p) {
							logger.error("polygon shading missing vertex", { vertexId: shape.vertexIds[i], shapeId: shape.id })
							throw errors.new("composite-shape: polygon missing vertex")
						}
						path.lineTo(p.x, p.y)
					}
					path.closePath()
				} else {
					const c = vertexMap.get(shape.centerId)
					if (!c) {
						logger.error("circle shading missing center", { shapeId: shape.id })
						throw errors.new("composite-shape: circle center missing")
					}
					const r = shape.radius
					path.moveTo(c.x + r, c.y)
					path.arcTo(r, r, 0, 1, 1, c.x - r, c.y)
					path.arcTo(r, r, 0, 1, 1, c.x + r, c.y)
					path.closePath()
				}
			}
			canvas.drawPath(path, { fill: region.fillColor, fillRule: "evenodd" })
		}
	}

	for (const shape of shapes) {
		if (shape.type === "polygon") {
			const points = shape.vertexIds.map((id) => {
				const p = vertexMap.get(id)
				if (!p) {
					logger.error("polygon outline missing vertex", { vertexId: id, shapeId: shape.id })
					throw errors.new("composite-shape: polygon missing vertex")
				}
				return { x: p.x, y: p.y }
			})
			canvas.drawPolyline(points, { stroke: theme.colors.axis, strokeWidth: theme.stroke.width.base })
		} else {
			const c = vertexMap.get(shape.centerId)
			if (!c) {
				logger.error("circle outline missing center", { shapeId: shape.id })
				throw errors.new("composite-shape: circle center missing")
			}
			canvas.drawCircle(c.x, c.y, shape.radius, {
				stroke: theme.colors.axis,
				strokeWidth: theme.stroke.width.base,
				fill: "none"
			})
		}
	}

	for (const seg of internalSegments) {
		const a = vertexMap.get(seg.fromVertexId)
		const b = vertexMap.get(seg.toVertexId)
		if (!a || !b) {
			logger.error("internal segment references missing vertex", {
				fromVertexId: seg.fromVertexId,
				toVertexId: seg.toVertexId
			})
			throw errors.new("composite-shape: internal segment missing vertex")
		}

		// Check if this segment is a radius (one endpoint is a circle center)
		let isRadius = false
		for (const shape of shapes) {
			if (shape.type === "circle") {
				const center = vertexMap.get(shape.centerId)
				if (center && ((a.x === center.x && a.y === center.y) || (b.x === center.x && b.y === center.y))) {
					isRadius = true
					break
				}
			}
		}

		canvas.drawLine(a.x, a.y, b.x, b.y, {
			stroke: isRadius ? "#ff0000" : theme.colors.axis,
			strokeWidth: theme.stroke.width.base,
			dash: seg.style === "dashed" ? theme.stroke.dasharray.dashed : undefined
		})
		if (seg.label) {
			const labelText = `${seg.label.value} ${seg.label.unit}`
			const midX = (a.x + b.x) / 2
			const midY = (a.y + b.y) / 2
			const angle = Math.atan2(b.y - a.y, b.x - a.x)

			// Check if this is a vertical line (for rectangle height labels)
			// Vertical lines have angles close to ±90 degrees (±π/2 radians)
			const isVertical = Math.abs(Math.abs(angle) - Math.PI / 2) < 0.1

			// Use larger offset for vertical lines to avoid clashing with radius labels
			let offset = isVertical ? 15 : 10

			// For vertical lines, determine which side to place the label
			// We want labels on the outside of rectangles when they're inside circles
			let labelX: number
			let labelY: number

			if (isVertical) {
				// For vertical lines in rectangles, determine if this is a left or right edge
				// by looking at all vertices to see what's on each side
				let hasVerticesOnLeft = false
				let hasVerticesOnRight = false

				// Check all vertices to see if any are significantly to the left or right
				// We need to check the vertices of the polygon that this segment belongs to

				// Find which shape this segment belongs to
				let relevantVertices: typeof vertices = []
				for (const shape of shapes) {
					if (shape.type === "polygon") {
						const shapeVertices: typeof vertices = []
						for (const id of shape.vertexIds) {
							const vertex = vertexMap.get(id)
							if (vertex) {
								shapeVertices.push(vertex)
							}
						}
						// Check if this segment is part of this polygon
						const hasA = shapeVertices.some((v) => v.x === a.x && v.y === a.y)
						const hasB = shapeVertices.some((v) => v.x === b.x && v.y === b.y)
						if (hasA && hasB) {
							relevantVertices = shapeVertices
							break
						}
					}
				}

				// If we couldn't find the shape, use all vertices as fallback
				if (relevantVertices.length === 0) {
					relevantVertices = vertices
				}

				for (const vertex of relevantVertices) {
					const dx = vertex.x - midX
					if (Math.abs(dx) > 5) {
						// Significant horizontal distance
						if (dx < 0) {
							hasVerticesOnLeft = true
						} else if (dx > 0) {
							hasVerticesOnRight = true
						}
					}
				}

				// Determine label placement based on what's around this edge
				if (hasVerticesOnRight && !hasVerticesOnLeft) {
					// This is the leftmost edge (vertices are to the right), place label to the left (outside)
					labelX = midX - offset
				} else if (hasVerticesOnLeft && !hasVerticesOnRight) {
					// This is the rightmost edge (vertices are to the left), place label to the right (outside)
					labelX = midX + offset
				} else if (hasVerticesOnLeft && hasVerticesOnRight) {
					// This is a middle vertical line or we have vertices on both sides
					// Check which side has more space by looking at the nearest vertices
					let minLeftDist = Number.POSITIVE_INFINITY
					let minRightDist = Number.POSITIVE_INFINITY

					for (const vertex of vertices) {
						const dx = vertex.x - midX
						if (dx < -1 && Math.abs(dx) < minLeftDist) {
							minLeftDist = Math.abs(dx)
						} else if (dx > 1 && Math.abs(dx) < minRightDist) {
							minRightDist = Math.abs(dx)
						}
					}

					// Place label on the side with more space
					if (minLeftDist > minRightDist) {
						labelX = midX - offset
					} else {
						labelX = midX + offset
					}
				} else {
					// Can't determine - use default perpendicular
					labelX = midX + offset * Math.sin(angle)
				}
				labelY = midY
			} else {
				// For non-vertical lines, use the standard perpendicular offset
				labelX = midX + offset * Math.sin(angle)
				labelY = midY - offset * Math.cos(angle)
			}
			// Check if this segment is a radius (for label coloring)
			let isRadiusLabel = false
			for (const shape of shapes) {
				if (shape.type === "circle") {
					const center = vertexMap.get(shape.centerId)
					if (center && ((a.x === center.x && a.y === center.y) || (b.x === center.x && b.y === center.y))) {
						isRadiusLabel = true
						break
					}
				}
			}

			canvas.drawText({
				x: labelX,
				y: labelY,
				text: labelText,
				anchor: "middle",
				dominantBaseline: "middle",
				fill: isRadiusLabel ? "#ff0000" : theme.colors.text,
				stroke: theme.colors.background,
				strokeWidth: "0.2em",
				paintOrder: "stroke fill"
			})
		}
	}

	const { svgBody, vbMinX, vbMinY, width: vbWidth, height: vbHeight } = canvas.finalize(20)
	return `<svg width="${width}" height="${height}" viewBox="${vbMinX} ${vbMinY} ${vbWidth} ${vbHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}" font-size="${theme.font.size.small}">${svgBody}</svg>`
}
