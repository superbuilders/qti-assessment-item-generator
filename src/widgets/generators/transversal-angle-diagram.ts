import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { Path2D } from "../../utils/path-builder"
import { theme } from "../../utils/theme"
import { estimateWrappedTextDimensions } from "../../utils/text"
import type { WidgetGenerator } from "../types"

// Factory function to create ray direction schema - avoids $ref in OpenAI JSON schema
function createRayDirSchema() {
	return z
		.object({
			dir: z.enum(["+", "-"]).describe("Ray direction relative to the line's angle. '+' points in the forward direction of the line's angle (0° = right, 90° = down), '-' points in the opposite direction (180° rotated)."),
		})
		.strict()
		.describe("Ray direction used within angle span definitions. The line (main or transversal) is determined by the angle variant.")
}

// Factory function to create angle schemas - avoids $ref in OpenAI JSON schema
function createAngleMainToTransversalSchema() {
	return z
		.object({
			span: z.literal("mainToTransversal").describe("Angle measured clockwise from the main line ray to the transversal ray"),
			label: z.string().describe("The numeric or symbolic label for the angle (e.g., '1', '2', 'α', '∠1'). This label appears outside the colored sector."),
			color: z
				.string()
				.regex(CSS_COLOR_PATTERN, "Invalid CSS color format")
				.describe("The fill color for the angle's sector (e.g., '#ff6b6b', '#4ecdc4'). The sector is drawn as a filled wedge."),
			fromRay: createRayDirSchema().describe("Ray on the main line (direction only). Angle starts here."),
			toRay: createRayDirSchema().describe("Ray on the transversal (direction only). Angle ends here."),
		})
		.strict()
}

function createAngleTransversalToMainSchema() {
	return z
		.object({
			span: z.literal("transversalToMain").describe("Angle measured clockwise from the transversal ray to the main line ray"),
			label: z.string().describe("The numeric or symbolic label for the angle (e.g., '1', '2', 'α', '∠1'). This label appears outside the colored sector."),
			color: z
				.string()
				.regex(CSS_COLOR_PATTERN, "Invalid CSS color format")
				.describe("The fill color for the angle's sector (e.g., '#ff6b6b', '#4ecdc4'). The sector is drawn as a filled wedge."),
			fromRay: createRayDirSchema().describe("Ray on the transversal (direction only). Angle starts here."),
			toRay: createRayDirSchema().describe("Ray on the main line (direction only). Angle ends here."),
		})
		.strict()
}

function createAngleAtIntersectionSchema() {
	return z
		.discriminatedUnion("span", [createAngleMainToTransversalSchema(), createAngleTransversalToMainSchema()])
		.describe("Defines an angle at an intersection as a clockwise span that must go between the main line and the transversal. The 'span' discriminant encodes direction.")
}

// Factory function to create intersection schema - avoids $ref in OpenAI JSON schema
function createIntersectionBaseSchema() {
	return z
		.object({
			label: z.string().describe("The label for the intersection point (e.g., 'M', 'N'). This appears as a point label in the diagram."),
			angles: z
				.array(createAngleAtIntersectionSchema())
				.min(1, "At least one angle is required for an intersection.")
				.describe("The angles formed at this intersection. Each angle spans from one ray to another between main and transversal."),
		})
		.strict()
		.describe("Intersection definition containing the point label and the list of angles at that vertex.")
}

// Factory function to create point labels schema - avoids $ref in OpenAI JSON schema
function createPointLabelsSchema() {
	return z
		.object({
			line1: z.array(z.string()).describe("Point labels to render along line1 (e.g., ['A', 'B']). These are purely visual markers and don't affect angle definitions."),
			line2: z.array(z.string()).describe("Point labels to render along line2 (e.g., ['C', 'D']). These are purely visual markers and don't affect angle definitions."),
			transversal: z.array(z.string()).describe("Point labels to render along the transversal (e.g., ['E', 'F']). These are purely visual markers and don't affect angle definitions."),
		})
		.strict()
		.describe("Cosmetic point labels to place along the lines for reference. Angles are defined purely by rays at intersections.")
		.nullable()
		.describe("Optional cosmetic point labels to place along the lines for reference. When null, no point labels are rendered. Angles are defined purely by rays at intersections.")
}

// Factory function to create the main schema - avoids $ref in OpenAI JSON schema
function createTransversalAngleDiagramPropsSchema() {
	return z
		.object({
			type: z.literal("transversalAngleDiagram").describe("Identifies this as a transversal angle diagram widget."),
			width: z.number().positive().describe("The total width of the SVG diagram in pixels. Recommended minimum: 400px for clear visibility of angles and labels."),
			height: z.number().positive().describe("The total height of the SVG diagram in pixels. Recommended minimum: 300px for clear visibility of angles and labels."),

			// Control the visual orientation (each main line can have its own angle)
			line1Angle: z.number().min(-360).max(360).describe("The angle of the first main line in degrees. 0° = horizontal right, 90° = vertical down, 180° = horizontal left, 270° = vertical up. This line can be at any angle - it doesn't need to be parallel to line2."),
			line2Angle: z.number().min(-360).max(360).describe("The angle of the second main line in degrees. 0° = horizontal right, 90° = vertical down, 180° = horizontal left, 270° = vertical up. This line can be at any angle - it doesn't need to be parallel to line1."),
			transversalAngle: z.number().min(-360).max(360).describe("The angle of the transversal line in degrees. 0° = horizontal right, 90° = vertical down, etc. The transversal must not be parallel to either main line (different angle modulo 180°)."),

			// Intersections keyed by main line, banning missing/extra intersections without tuples or refines
			intersections: z
				.object({
					line1: createIntersectionBaseSchema().describe("Intersection of line1 with the transversal. Provide the point label and angles here."),
					line2: createIntersectionBaseSchema().describe("Intersection of line2 with the transversal. Provide the point label and angles here."),
				})
				.strict()
				.describe("Intersections keyed by main line. There must be exactly one intersection for line1 and one for line2."),

			// Optional labels to render points along the lines (purely cosmetic)
			pointLabels: createPointLabelsSchema().describe("Optional point labels to render along the lines for geometric reference (e.g., points A, B, C, D, E, F). These are purely cosmetic and don't affect angle definitions. Angles are defined by rays at intersections, not by these points."),
		})
		.strict()
		.describe("Creates a diagram of two lines (which may or may not be parallel) intersected by a transversal line, ideal for teaching angle relationships like corresponding angles, alternate interior angles, alternate exterior angles, and vertical angles. Uses an elegant ray-based API with a discriminated union for angles and fixed intersections keyed by main line.")
}

// Export the schema created by the factory function
export const TransversalAngleDiagramPropsSchema = createTransversalAngleDiagramPropsSchema()

export type TransversalAngleDiagramProps = z.infer<typeof TransversalAngleDiagramPropsSchema>

/**
 * Generates an SVG diagram of two lines intersected by a transversal.
 * 
 * This widget uses a ray-based approach for defining angles:
 * - At each intersection, there are 4 rays: main+, main-, transversal+, transversal-
 * - Angles are defined as clockwise spans from one ray to another
 * - This eliminates the need to reference specific points and makes the API much cleaner
 * - The approach mirrors the radially-constrained-angle-diagram widget for consistency
 * 
 * Ray directions:
 * - '+' direction: points in the forward direction of the line's angle
 * - '-' direction: points 180° opposite to the line's angle
 * 
 * Example: For a horizontal line (angle=0°):
 * - main+ ray points right (0°)
 * - main- ray points left (180°)
 * 
 * Example: For a vertical line (angle=90°):
 * - main+ ray points down (90°)
 * - main- ray points up (270°)
 */
export const generateTransversalAngleDiagram: WidgetGenerator<
	typeof TransversalAngleDiagramPropsSchema
> = async (props) => {
	const { width, height, line1Angle, line2Angle, transversalAngle, intersections, pointLabels } = props

	// --- BEGIN RUNTIME INVARIANT VALIDATION ---
	// 0. basic geometric sanity: transversal not parallel to either main line
	const norm = (deg: number) => ((deg % 180) + 180) % 180
	const n1 = norm(line1Angle)
	const n2 = norm(line2Angle)
	const nt = norm(transversalAngle)
	if (nt === n1 || nt === n2) {
		logger.error("invalid geometry: transversal parallel to a main line", { line1Angle, line2Angle, transversalAngle })
		throw errors.new("transversal cannot be parallel to either main line")
	}

	// 1. Validate intersection labels are unique
	const labels = [intersections.line1.label, intersections.line2.label]
	if (labels[0] === labels[1]) {
		logger.error("duplicate intersection labels", { labels })
		throw errors.new("intersection labels must be unique")
	}
	// --- END RUNTIME INVARIANT VALIDATION ---

	const canvas = new CanvasImpl({
		chartArea: { left: 0, top: 0, width, height },
		fontPxDefault: 16,
		lineHeightDefault: 1.2,
	})

	const cx = width / 2
	const cy = height / 2
	const toRad = (deg: number) => (deg * Math.PI) / 180

	const line1Rad = toRad(line1Angle)
	const line2Rad = toRad(line2Angle)
	const transversalRad = toRad(transversalAngle)

	// --- LAYOUT CALCULATION ---
	// 1. Calculate intersection points, spaced symmetrically around the center along the transversal
	const spacing = Math.min(width, height) * 0.25
	const dx = (spacing / 2) * Math.cos(transversalRad)
	const dy = (spacing / 2) * Math.sin(transversalRad)
	const intersectionPos = {
		line1: { x: cx - dx, y: cy - dy },
		line2: { x: cx + dx, y: cy + dy },
	}

	// Helpers to compute ray absolute angle at an intersection
	const resolveRayAngle = (raySide: "main" | "transversal", dir: "+" | "-", main: "line1" | "line2"): number => {
		const base = raySide === "transversal" ? transversalRad : main === "line1" ? line1Rad : line2Rad
		return dir === "+" ? base : base + Math.PI
	}

	// Optional point labels rendering setup
	const linePointLabels = {
		line1: pointLabels?.line1 ?? [],
		line2: pointLabels?.line2 ?? [],
		transversal: pointLabels?.transversal ?? [],
	}

	// Position optional point labels closer to canvas edges to maximize interior space
	const pointPositions = new Map<string, { x: number; y: number }>()
	const pointDist = Math.min(width, height) * 0.35 // Increased distance to push points toward edges
	const pushPointsFor = (labelsArr: string[], angleRad: number, center: { x: number; y: number }) => {
		labelsArr.forEach((label, idx) => {
			const sign = idx % 2 === 0 ? 1 : -1
			pointPositions.set(label, {
				x: center.x + sign * pointDist * Math.cos(angleRad),
				y: center.y + sign * pointDist * Math.sin(angleRad),
			})
		})
	}
	pushPointsFor(linePointLabels.line1, line1Rad, intersectionPos.line1)
	pushPointsFor(linePointLabels.line2, line2Rad, intersectionPos.line2)
	pushPointsFor(linePointLabels.transversal, transversalRad, { x: cx, y: cy })

	// --- DRAWING ---
	// 1. Draw angle sectors first so they appear under the lines
	const sectorRadius = spacing * 0.3 // Reduced from 0.4 to 0.3 to make more room for labels
	const labelRadius = sectorRadius + 14 // Reduced from 24 to 14 to move labels closer to sectors
	const pendingAngleLabels: Array<{
		x: number
		y: number
		text: string
		midAngleRad: number
		origin: { x: number; y: number }
	}> = []
	const drawAnglesFor = (main: "line1" | "line2", at: { x: number; y: number }, angles: z.infer<ReturnType<typeof createAngleAtIntersectionSchema>>[]) => {
		for (const a of angles) {
			// Determine absolute angles depending on span variant
			let startAngleRad: number
			let endAngleRad: number
			if (a.span === "mainToTransversal") {
				startAngleRad = resolveRayAngle("main", a.fromRay.dir, main)
				endAngleRad = resolveRayAngle("transversal", a.toRay.dir, main)
			} else {
				startAngleRad = resolveRayAngle("transversal", a.fromRay.dir, main)
				endAngleRad = resolveRayAngle("main", a.toRay.dir, main)
			}
			let sweep = endAngleRad - startAngleRad
			if (sweep <= 0) sweep += 2 * Math.PI
			const largeArcFlag = sweep > Math.PI ? 1 : 0

			const startPt = { x: at.x + sectorRadius * Math.cos(startAngleRad), y: at.y + sectorRadius * Math.sin(startAngleRad) }
			const endPt = { x: at.x + sectorRadius * Math.cos(endAngleRad), y: at.y + sectorRadius * Math.sin(endAngleRad) }

			const path = new Path2D()
				.moveTo(at.x, at.y)
				.lineTo(startPt.x, startPt.y)
				.arcTo(sectorRadius, sectorRadius, 0, largeArcFlag, 1, endPt.x, endPt.y)
				.closePath()
			canvas.drawPath(path, { fill: a.color, stroke: "none" })

			const midAngleRad = startAngleRad + sweep / 2
			pendingAngleLabels.push({ x: at.x + labelRadius * Math.cos(midAngleRad), y: at.y + labelRadius * Math.sin(midAngleRad), text: a.label, midAngleRad, origin: { x: at.x, y: at.y } })
		}
	}
	drawAnglesFor("line1", intersectionPos.line1, intersections.line1.angles)
	drawAnglesFor("line2", intersectionPos.line2, intersections.line2.angles)

	// 2. Draw the three lines on top of sectors (shortened to reduce wasted space)
	const lineLength = Math.max(width, height) * 0.8 // Reduced from 1.5 to 0.8
	const screenSegments: Array<{ a: { x: number; y: number }; b: { x: number; y: number } }> = []
	const drawLine = (center: { x: number; y: number }, angleRad: number) => {
		const ldx = (lineLength / 2) * Math.cos(angleRad)
		const ldy = (lineLength / 2) * Math.sin(angleRad)
		const ax = center.x - ldx
		const ay = center.y - ldy
		const bx = center.x + ldx
		const by = center.y + ldy
		canvas.drawLine(ax, ay, bx, by, {
			stroke: theme.colors.black,
			strokeWidth: theme.stroke.width.thick,
		})
		screenSegments.push({ a: { x: ax, y: ay }, b: { x: bx, y: by } })
	}
	drawLine(intersectionPos.line1, line1Rad)
	drawLine(intersectionPos.line2, line2Rad)
	drawLine({ x: cx, y: cy }, transversalRad)

	// Collision helper copied in spirit from composite-shape-diagram
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
		if (maxX < rx || minX > rx + rw || maxY < ry || minY > ry + rh) return false

		const r1 = { x: rx, y: ry }
		const r2 = { x: rx + rw, y: ry }
		const r3 = { x: rx + rw, y: ry + rh }
		const r4 = { x: rx, y: ry + rh }
		const orient = (p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) => {
			const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)
			if (val > 1e-9) return 1
			if (val < -1e-9) return -1
			return 0
		}
		const segmentsIntersect = (
			p1: { x: number; y: number },
			p2: { x: number; y: number },
			p3: { x: number; y: number },
			p4: { x: number; y: number }
		) => {
			const o1 = orient(p1, p2, p3)
			const o2 = orient(p1, p2, p4)
			const o3 = orient(p3, p4, p1)
			const o4 = orient(p3, p4, p2)
			return o1 !== o2 && o3 !== o4
		}
		return (
			segmentsIntersect(A, B, r1, r2) ||
			segmentsIntersect(A, B, r2, r3) ||
			segmentsIntersect(A, B, r3, r4) ||
			segmentsIntersect(A, B, r4, r1)
		)
	}

	function rectIntersectsAnySegment(rect: { x: number; y: number; width: number; height: number; pad?: number }): boolean {
		for (const seg of screenSegments) {
			if (segmentIntersectsRect(seg.a, seg.b, rect)) return true
		}
		return false
	}

	// 3. Draw angle labels above lines
	for (const item of pendingAngleLabels) {
		const fontPx = 16
		const { maxWidth: w, height: h } = estimateWrappedTextDimensions(item.text, Number.POSITIVE_INFINITY, fontPx, 1.2)
		const halfW = w / 2
		const halfH = h / 2
		const dirX = Math.cos(item.midAngleRad)
		const dirY = Math.sin(item.midAngleRad)
		const baseOffsetPx = 0

		function placeFor(mult: number) {
			let px = item.x + mult * baseOffsetPx * dirX
			let py = item.y + mult * baseOffsetPx * dirY
			let it = 0
			const maxIt = 60
			const step = 2
			while (
				rectIntersectsAnySegment({ x: px - halfW, y: py - halfH, width: w, height: h, pad: 1 }) &&
				it < maxIt
			) {
				px += mult * step * dirX
				py += mult * step * dirY
				it++
			}
			return { x: px, y: py, it }
		}

		const outward = placeFor(1)
		const inward = placeFor(-1)
		const chosen = inward.it < outward.it ? inward : outward

		canvas.drawText({
			x: chosen.x,
			y: chosen.y,
			text: item.text,
			fill: theme.colors.black,
			anchor: "middle",
			dominantBaseline: "middle",
			fontPx,
			fontWeight: theme.font.weight.bold,
		})
	}

	// 4. Draw optional point labels and their markers on top (with collision avoidance)
	const pointLabelOffset = 22
	for (const [label, pos] of pointPositions) {
		canvas.drawCircle(pos.x, pos.y, 5, { fill: theme.colors.black })

		const fontPx = 20
		const { maxWidth: w, height: h } = estimateWrappedTextDimensions(label, Number.POSITIVE_INFINITY, fontPx, 1.2)
		const halfW = w / 2
		const halfH = h / 2

		const baseX = pos.x
		const baseY = pos.y - pointLabelOffset
		let bestX = baseX
		let bestY = baseY
		let minCollisions = Number.POSITIVE_INFINITY

		for (let i = 0; i < 8; i++) {
			const angle = (i * Math.PI) / 4 // 0..2π in 45° increments
			for (let dist = 0; dist <= 40; dist += 3) {
				const testX = baseX + dist * Math.cos(angle)
				const testY = baseY + dist * Math.sin(angle)
				const rect = { x: testX - halfW, y: testY - halfH, width: w, height: h }
				let collisions = 0
				for (const seg of screenSegments) {
					if (segmentIntersectsRect(seg.a, seg.b, rect)) collisions++
				}
				if (collisions < minCollisions) {
					minCollisions = collisions
					bestX = testX
					bestY = testY
				}
				if (minCollisions === 0) break
			}
			if (minCollisions === 0) break
		}

		canvas.drawText({
			x: bestX,
			y: bestY,
			text: label,
			fill: theme.colors.black,
			anchor: "middle",
			dominantBaseline: "middle",
			fontPx,
			fontWeight: theme.font.weight.bold,
		})
	}

	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)
	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}">${svgBody}</svg>`
}