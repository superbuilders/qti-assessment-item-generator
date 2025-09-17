import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { Path2D } from "../../utils/path-builder"
import { estimateWrappedTextDimensions } from "../../utils/text"
import { MATHML_INNER_PATTERN } from "../../utils/mathml"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

// -----------------------------
// Constraint-first schema (angles by three points)
// -----------------------------

// Domain-specific value factories with distinct constraints
function createAngleValueSchema() {
	return z
		.discriminatedUnion("type", [
			z.object({ type: z.literal("numeric"), value: z.number().gt(0).lt(180) }).strict(),
			z.object({ type: z.literal("symbolic"), symbol: z.string() }).strict()
		])
		.describe("Angle value in degrees (0<deg<180) or symbolic variable")
}

function createSideValueSchema() {
	return z
		.discriminatedUnion("type", [
			z.object({ type: z.literal("numeric"), value: z.number().gt(0) }).strict(),
			z.object({ type: z.literal("symbolic"), symbol: z.string() }).strict(),
			z
				.object({
					type: z.literal("mathml"),
					mathml: z
						.string()
						.regex(
							MATHML_INNER_PATTERN,
							"invalid mathml snippet; must be inner MathML without outer <math> wrapper"
						),
					value: z.number().gt(0)
				})
				.strict()
		])
		.describe("Side length label: numeric, symbolic, or MathML with numeric value")
}

function createAngleMarkSchema() {
	return z
		.object({
			vertex: z.string().regex(TRI_POINT_ID).describe("Vertex point id of the angle"),
			from: z.string().regex(TRI_POINT_ID).describe("Ray start point id around the vertex"),
			to: z.string().regex(TRI_POINT_ID).describe("Ray end point id around the vertex"),
			value: createAngleValueSchema().describe("Angle value for the arc"),
			color: z.string().regex(CSS_COLOR_PATTERN, "invalid css color").describe("Arc color for the mark.")
		})
		.strict()
}

function createSidesLabelSchema() {
	return z
		.object({
			AB: createSideValueSchema().nullable(),
			BC: createSideValueSchema().nullable(),
			CA: createSideValueSchema().nullable()
		})
		.strict()
		.describe("Optional labels for each side.")
}

// Replace constants with factory functions
const TRI_POINT_ID = /^pt_tri_[A-Za-z0-9_]+$/

function createTrianglePointsSchema() {
	return z
		.object({
			A: z.object({ id: z.string().regex(TRI_POINT_ID), label: z.string() }).strict().describe("point A"),
			B: z.object({ id: z.string().regex(TRI_POINT_ID), label: z.string() }).strict().describe("point B"),
			C: z.object({ id: z.string().regex(TRI_POINT_ID), label: z.string() }).strict().describe("point C")
		})
		.strict()
}

function createAuxiliaryPointsSchema() {
	return z
		.array(z.object({ id: z.string().regex(TRI_POINT_ID), label: z.string() }).strict())
		.nullable()
}

function createConstructionLinesSchema() {
	return z
		.array(
			z
				.object({
					points: z.array(z.string().regex(TRI_POINT_ID)).min(2).max(3),
					style: z.enum(["solid", "dashed", "dotted"]) 
				})
				.strict()
		)
		.nullable()
}

function createLinesSchema() {
	return z
		.array(z.array(z.string().regex(TRI_POINT_ID)).min(2))
		.nullable()
}

function createAltitudeSchema() {
	return z
		.object({
			vertex: z.string().regex(TRI_POINT_ID),
			toSide: z.enum(["AB", "BC", "CA"]),
			value: createSideValueSchema().nullable(),
			style: z.enum(["dashed", "dotted"]),
			color: z.string().regex(CSS_COLOR_PATTERN, "invalid css color"),
			withRightAngle: z.literal(true)
		})
		.strict()
}

export const TriangleDiagramPropsSchema = z
	.object({
		type: z.literal("triangleDiagram"),
		width: z.number().positive(),
		height: z.number().positive(),
		points: createTrianglePointsSchema(),
		extraPoints: createAuxiliaryPointsSchema(),
		angleArcs: z.array(createAngleMarkSchema()).min(2),
		sideLabels: createSidesLabelSchema().nullable(),
		constructionLines: createConstructionLinesSchema(),
		lines: createLinesSchema(),
		altitudes: z.array(createAltitudeSchema()).nullable(),
		rightAngleMarks: z.array(z.object({
			vertex: z.string().regex(TRI_POINT_ID),
			from: z.string().regex(TRI_POINT_ID),
			to: z.string().regex(TRI_POINT_ID),
			size: z.number().positive().nullable()
		}).strict()).nullable()
	})
	.strict()
	.describe(
		"Constraint-first triangle diagram. Angles defined by three point ids; auxiliary points and colinear constraints enable exterior angles."
	)

export type TriangleDiagramProps = z.infer<typeof TriangleDiagramPropsSchema>

type Vec = { x: number; y: number }

function toRad(deg: number): number {
	return (deg * Math.PI) / 180
}

// function toDeg(rad: number): number {
// 	return (rad * 180) / Math.PI
// }

function vecAdd(a: Vec, b: Vec): Vec {
	return { x: a.x + b.x, y: a.y + b.y }
}

function vecScale(a: Vec, s: number): Vec {
	return { x: a.x * s, y: a.y * s }
}

// function dist(a: Vec, b: Vec): number {
// 	return Math.hypot(a.x - b.x, a.y - b.y)
// }

function lineIntersection(p: Vec, v: Vec, q: Vec, w: Vec): Vec {
	// Solve p + t v = q + s w
	const det = v.x * w.y - v.y * w.x
	if (Math.abs(det) < 1e-9) {
		logger.error("triangle lines parallel", { v, w })
		throw errors.new("triangle geometry: parallel lines")
	}
	const t = ((q.x - p.x) * w.y - (q.y - p.y) * w.x) / det
	return { x: p.x + t * v.x, y: p.y + t * v.y }
}

function angleOf(v: Vec): number {
	return Math.atan2(v.y, v.x)
}

function drawArc(canvas: CanvasImpl, center: Vec, r: number, start: number, end: number, color: string): void {
	// Normalize
	let s = start
	let e = end
	while (e - s > Math.PI * 2) e -= Math.PI * 2
	while (s - e > Math.PI * 2) s -= Math.PI * 2
	const largeFlag: 0 | 1 = Math.abs(e - s) > Math.PI ? 1 : 0
	const sweepFlag: 0 | 1 = e >= s ? 1 : 0
	const sx = center.x + r * Math.cos(s)
	const sy = center.y + r * Math.sin(s)
	const ex = center.x + r * Math.cos(e)
	const ey = center.y + r * Math.sin(e)
	const path = new Path2D().moveTo(sx, sy).arcTo(r, r, 0, largeFlag, sweepFlag, ex, ey)
	canvas.drawPath(path, { fill: "none", stroke: color, strokeWidth: theme.stroke.width.thick })
}

type AngleValue = z.infer<ReturnType<typeof createAngleValueSchema>>
type SideValue = z.infer<ReturnType<typeof createSideValueSchema>>

function angleValueToString(v: AngleValue): string {
	return v.type === "numeric" ? `${v.value}\u00B0` : v.symbol
}

function sideValueToString(v: SideValue): string {
	if (v.type === "numeric") return `${v.value}`
	if (v.type === "symbolic") return v.symbol
	if (v.type === "mathml") return v.value.toString()
	return ""
}

// forward-only schema: no legacy normalization helpers

export const generateTriangleDiagram: WidgetGenerator<typeof TriangleDiagramPropsSchema> = async (
	props
) => {
	const { width, height, angleArcs, sideLabels, points, extraPoints, constructionLines, lines, altitudes, rightAngleMarks } = props

	const canvas = new CanvasImpl({
		chartArea: { left: 0, top: 0, width, height },
		fontPxDefault: 12,
		lineHeightDefault: 1.2
	})

	// --- Derive interior angles at A and B from constraints ---
	const idA = points.A.id
	const idB = points.B.id
	const idC = points.C.id

	const onSameLine = (...ids: string[]): boolean => {
		if (!lines) return false
		for (const L of lines) {
			let ok = true
			for (const id of ids) if (!L.includes(id)) { ok = false; break }
			if (ok) return true
		}
		return false
	}

	type AngleMarkNormalized = { vertex: string; from: string; to: string; value: AngleValue; color: string }
	const angleMarks: AngleMarkNormalized[] = angleArcs.map((m) => ({
		vertex: m.vertex,
		from: m.from,
		to: m.to,
		value: m.value,
		color: m.color
	}))

	const rightAt = new Set<string>((rightAngleMarks ?? []).map((r) => r.vertex))

	function tryInteriorDegFor(vertex: string): number | null {
		const others = vertex === idA ? [idB, idC] : vertex === idB ? [idA, idC] : [idA, idB]
		const arcs = angleMarks.filter((a) => a.vertex === vertex && a.value.type === "numeric")
		let fromArcs: number | null = null
		for (const a of arcs) {
			const f = a.from
			const t = a.to
			const val = (a.value as { type: "numeric"; value: number }).value
			if ((f === others[0] && t === others[1]) || (f === others[1] && t === others[0])) { fromArcs = val; break }
			if (
				(f === others[0] && onSameLine(vertex, others[1], t)) ||
				(t === others[0] && onSameLine(vertex, others[1], f)) ||
				(f === others[1] && onSameLine(vertex, others[0], t)) ||
				(t === others[1] && onSameLine(vertex, others[0], f))
			) {
				fromArcs = 180 - val
				break
			}
		}
		if (fromArcs != null) {
			if (rightAt.has(vertex) && Math.abs(fromArcs - 90) > 1e-6) {
				logger.error("conflicting angle constraints at vertex", { vertex, numeric: fromArcs })
				throw errors.new("conflicting angle constraints")
			}
			return fromArcs
		}
		if (rightAt.has(vertex)) return 90
		return null
	}

	let Adeg = tryInteriorDegFor(idA)
	let Bdeg = tryInteriorDegFor(idB)
	let Cdeg = tryInteriorDegFor(idC)

	const known = [Adeg, Bdeg, Cdeg].filter((v): v is number => typeof v === "number")
	if (known.length < 2) {
		logger.error("insufficient numeric angle constraints", { hasA: Adeg != null, hasB: Bdeg != null, hasC: Cdeg != null })
		throw errors.new("insufficient numeric angle constraints")
	}
	if (Adeg == null && Bdeg != null && Cdeg != null) Adeg = 180 - (Bdeg + Cdeg)
	if (Bdeg == null && Adeg != null && Cdeg != null) Bdeg = 180 - (Adeg + Cdeg)
	if (Cdeg == null && Adeg != null && Bdeg != null) Cdeg = 180 - (Adeg + Bdeg)

	if (!(Adeg != null && Bdeg != null && Cdeg != null && Adeg > 0 && Bdeg > 0 && Cdeg > 0)) {
		logger.error("derived triangle angles invalid", { A: Adeg, B: Bdeg, C: Cdeg })
		throw errors.new("invalid derived triangle angles")
	}

	// From here, non-null assertion via local copies guarantees type safety
	const AdegVal = Adeg as number
	const BdegVal = Bdeg as number
	// const CdegVal = Cdeg as number

	// --- Data space geometry (unit base), then fit to box ---
	const A_data: Vec = { x: 0, y: 0 }
	const B_data: Vec = { x: 1, y: 0 }
	const vA_data: Vec = { x: Math.cos(toRad(AdegVal)), y: -Math.sin(toRad(AdegVal)) }
	const vB_data: Vec = { x: -Math.cos(toRad(BdegVal)), y: -Math.sin(toRad(BdegVal)) }
	const C_data = lineIntersection(A_data, vA_data, B_data, vB_data)

	function computeFit(pointsList: Vec[]) {
		if (pointsList.length === 0) {
			return { scale: 1, project: (p: Vec) => p }
		}
		const minX = Math.min(...pointsList.map((p) => p.x))
		const maxX = Math.max(...pointsList.map((p) => p.x))
		const minY = Math.min(...pointsList.map((p) => p.y))
		const maxY = Math.max(...pointsList.map((p) => p.y))
		const rawW = maxX - minX
		const rawH = maxY - minY
		const scale = Math.min((width - 2 * PADDING) / (rawW || 1), (height - 2 * PADDING) / (rawH || 1))
		const offsetX = (width - scale * rawW) / 2 - scale * minX
		const offsetY = (height - scale * rawH) / 2 - scale * minY
		const project = (p: Vec) => ({ x: offsetX + scale * p.x, y: offsetY + scale * p.y })
		return { scale, project }
	}

	const { project } = computeFit([A_data, B_data, C_data])
	const A = project(A_data)
	const B = project(B_data)
	const C = project(C_data)

	// We'll draw arcs first; lines and labels will be drawn after to sit on top
	const vertexFont = theme.font.size.large

	// Build id map including primary vertices
	const idToPoint = new Map<string, Vec>([
		[idA, A],
		[idB, B],
		[idC, C]
	])

	// Place auxiliary points using colinear constraints
	if (lines) {
		for (const line of lines) {
			const knownIdx: number[] = []
			for (let i = 0; i < line.length; i++) if (idToPoint.has(line[i])) knownIdx.push(i)
			if (knownIdx.length < 2) continue
			const p1 = idToPoint.get(line[knownIdx[0]])!
			const p2 = idToPoint.get(line[knownIdx[1]])!
			const dir = { x: p2.x - p1.x, y: p2.y - p1.y }
			const baseLen = Math.hypot(dir.x, dir.y) || 1
			const ux = dir.x / baseLen
			const uy = dir.y / baseLen
			const step = baseLen * 0.3
			const anchor = knownIdx[0]
			for (let i = anchor + 1; i < line.length; i++) {
				const prev = idToPoint.get(line[i - 1])
				const curId = line[i]
				if (!prev) break
				if (!idToPoint.has(curId)) idToPoint.set(curId, { x: prev.x + step * ux, y: prev.y + step * uy })
			}
			for (let i = anchor - 1; i >= 0; i--) {
				const next = idToPoint.get(line[i + 1])
				const curId = line[i]
				if (!next) break
				if (!idToPoint.has(curId)) idToPoint.set(curId, { x: next.x - step * ux, y: next.y - step * uy })
			}

			// Do not draw base lines yet; arcs will be drawn first
		}
	}

	// Build screen segments for collision detection (triangle edges + explicit base lines)
	const screenSegments: Array<{ a: { x: number; y: number }; b: { x: number; y: number } }> = []
	screenSegments.push({ a: A, b: B }, { a: B, b: C }, { a: C, b: A })
	if (lines) {
		for (const line of lines) {
			for (let i = 1; i < line.length; i++) {
				const p1 = idToPoint.get(line[i - 1])
				const p2 = idToPoint.get(line[i])
				if (p1 && p2) screenSegments.push({ a: p1, b: p2 })
			}
		}
	}

	// Optional construction lines
	if (constructionLines) {
		for (const line of constructionLines) {
			const pts = line.points
				.map((pid: string) => idToPoint.get(pid))
				.filter((p: Vec | undefined): p is Vec => p != null)
			if (pts.length >= 2) {
				const dash = line.style === "dashed" ? "4 3" : line.style === "dotted" ? "2 4" : undefined
				for (let i = 1; i < pts.length; i++) {
					const p1 = pts[i - 1]
					const p2 = pts[i]
					canvas.drawLine(p1.x, p1.y, p2.x, p2.y, { stroke: theme.colors.black, strokeWidth: theme.stroke.width.base, dash })
					screenSegments.push({ a: p1, b: p2 })
				}
			}
		}
	}

	// Draw angle arcs by three points (uniform radius, minor arc only)
	// Track preferred label directions: opposite the arc's mid-angle
	const preferredOppositeByVertex = new Map<string, number>()
	for (const mark of angleArcs) {
		const center = idToPoint.get(mark.vertex)
		const pf = idToPoint.get(mark.from)
		const pt = idToPoint.get(mark.to)
		if (!center || !pf || !pt) {
			logger.error("missing points for angle arc", { mark })
			throw errors.new("missing points for angle arc")
		}

		const v1: Vec = { x: pf.x - center.x, y: pf.y - center.y }
		const v2: Vec = { x: pt.x - center.x, y: pt.y - center.y }

		let a1 = angleOf(v1)
		let a2 = angleOf(v2)
		let d = a2 - a1
		while (d <= -Math.PI) d += 2 * Math.PI
		while (d > Math.PI) d -= 2 * Math.PI
		const sweep = Math.abs(d)
		let start = d >= 0 ? a1 : a2
		let end = start + sweep

		// Dynamic, screen-space arc radius: doubled base, scaled by angle size (smaller angle -> slightly larger radius)
		const baseArcRadius = 36
		const sweepRatio = Math.min(Math.max(sweep / Math.PI, 0), 1) // 0..1 for 0..180°
		const sizeScale = 0.85 + (1 - sweepRatio) * 0.35 // 0.85..1.2
		const arcRadius = baseArcRadius * sizeScale
		drawArc(canvas, center, arcRadius, start, end, mark.color)

		// Label with collision-aware placement using estimated text size
		const mid = (start + end) / 2
		// Save opposite direction for vertex label placement later
		preferredOppositeByVertex.set(mark.vertex, (mid + Math.PI) % (2 * Math.PI))
		const baseR = arcRadius + 18
	// const segments = [
	// 	{ p1: A, p2: B },
	// 	{ p1: B, p2: C },
	// 	{ p1: C, p2: A }
	// ]
	// const orient = (a: Vec, b: Vec, c: Vec) => {
	// 	const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
	// 	if (val > 1e-9) return 1
	// 	if (val < -1e-9) return -1
	// 				return 0
	// 			}
	// const intersects = (a: Vec, b: Vec, c: Vec, d2: Vec) => {
	// 	const o1 = orient(a, b, c)
	// 	const o2 = orient(a, b, d2)
	// 	const o3 = orient(c, d2, a)
	// 	const o4 = orient(c, d2, b)
	// 	return o1 !== o2 && o3 !== o4
	// }
		// const rectHitsAnySegment = (rect: { x: number; y: number; width: number; height: number; pad?: number }): boolean => {
		// const pad = rect.pad ?? 0
		// const rx = rect.x - pad
		// const ry = rect.y - pad
		// const rw = rect.width + 2 * pad
		// const rh = rect.height + 2 * pad
		// const corners = [
		// 	{ x: rx, y: ry },
		// 	{ x: rx + rw, y: ry },
		// 	{ x: rx + rw, y: ry + rh },
		// 	{ x: rx, y: ry + rh }
		// ]
		// for (const s of segments) {
		// 	if (
		// 		intersects(s.p1, s.p2, corners[0], corners[1]) ||
		// 		intersects(s.p1, s.p2, corners[1], corners[2]) ||
		// 		intersects(s.p1, s.p2, corners[2], corners[3]) ||
		// 		intersects(s.p1, s.p2, corners[3], corners[0])
		// 	) {
		// 		return true
		// 	}
		// }
		// return false
	// }
		const text = angleValueToString(mark.value)
		const fontPx = theme.font.size.medium
		const { maxWidth, height: textH } = estimateWrappedTextDimensions(text, Number.POSITIVE_INFINITY, fontPx, 1.2)
		const halfW = maxWidth / 2
		const halfH = textH / 2
		let best = { x: center.x + baseR * Math.cos(mid), y: center.y + baseR * Math.sin(mid) }
		let minHits = Number.POSITIVE_INFINITY
		// Prefer placing labels opposite the triangle interior
		// const tri = [A, B, C]
		// function pointInTriangle(p: Vec): boolean {
		// const [p0, p1, p2] = tri
		// const area = (a: Vec, b: Vec, c: Vec) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
		// const s1 = area(p0, p1, p)
		// const s2 = area(p1, p2, p)
		// const s3 = area(p2, p0, p)
		// const hasNeg = (s1 < 0) || (s2 < 0) || (s3 < 0)
		// const hasPos = (s1 > 0) || (s2 > 0) || (s3 > 0)
		// return !(hasNeg && hasPos)
	// }
		// Try interior first unless the angle is very acute; if collisions persist, flip outside
		const acuteDeg = (sweep * 180) / Math.PI
		const tryOrders: number[] = []
		if (acuteDeg < 25) {
			tryOrders.push(-1, 1) // prefer outside for very acute angles
		} else {
			tryOrders.push(1, -1) // otherwise prefer inside
		}
		for (const dirSign of tryOrders) {
			for (const dr of [0, 8, -8, 16, -16, 24]) {
				for (const dt of [0, Math.PI / 18, -Math.PI / 18]) {
					const r = baseR + dr
					const ang = mid + dt
					const x = center.x + dirSign * r * Math.cos(ang)
					const y = center.y + dirSign * r * Math.sin(ang)
					const rect = { x: x - halfW, y: y - halfH, width: maxWidth, height: textH, pad: 2 }
					const hits = rectIntersectsAnySegment(rect) ? 1 : 0
					if (hits < minHits) {
						minHits = hits
						best = { x, y }
					}
					if (minHits === 0) break
				}
				if (minHits === 0) break
			}
			if (minHits === 0) break
		}
		canvas.drawText({ x: best.x, y: best.y, text, fill: theme.colors.black, anchor: "middle", dominantBaseline: "middle", fontPx, fontWeight: theme.font.weight.bold })
	}

	// After arcs: draw triangle lines and any explicit base lines so lines sit on top
	canvas.drawPolygon([A, B, C], { fill: "none", stroke: theme.colors.black, strokeWidth: theme.stroke.width.thick })
	if (lines) {
		for (const line of lines) {
			for (let i = 1; i < line.length; i++) {
				const a = idToPoint.get(line[i - 1])
				const b = idToPoint.get(line[i])
				if (a && b) canvas.drawLine(a.x, a.y, b.x, b.y, { stroke: theme.colors.black, strokeWidth: theme.stroke.width.thick })
			}
		}
	}

	// Altitudes (dropped heights)
	if (altitudes) {
		const sideMap: Record<"AB" | "BC" | "CA", { p1: Vec; p2: Vec }> = {
			AB: { p1: A, p2: B },
			BC: { p1: B, p2: C },
			CA: { p1: C, p2: A }
		}
		const vertexMap: Record<string, Vec> = { [points.A.id]: A, [points.B.id]: B, [points.C.id]: C }
		for (const alt of altitudes) {
			const v = vertexMap[alt.vertex]
			const base = sideMap[alt.toSide]
			if (!v || !base) {
				logger.error("altitude references unknown points", { alt })
				throw errors.new("invalid altitude references")
			}
			const bx = base.p2.x - base.p1.x
			const by = base.p2.y - base.p1.y
			const len2 = bx * bx + by * by
			if (len2 === 0) {
				logger.error("altitude base degenerate", { alt })
				throw errors.new("invalid altitude base")
			}
			const t = ((v.x - base.p1.x) * bx + (v.y - base.p1.y) * by) / len2
			if (t < 0 || t > 1) {
				logger.error("altitude foot outside segment", { alt, t })
				throw errors.new("altitude foot outside segment")
			}
			const foot: Vec = { x: base.p1.x + t * bx, y: base.p1.y + t * by }
			const dash = alt.style === "dashed" ? "4 3" : "2 4"
			canvas.drawLine(v.x, v.y, foot.x, foot.y, { stroke: alt.color, strokeWidth: theme.stroke.width.base, dash })
			// add to collision segments
			screenSegments.push({ a: v, b: foot })
			if (alt.withRightAngle) {
				// Draw right angle square at foot using base direction and altitude direction
				const bl = Math.hypot(bx, by) || 1
				const nbx = bx / bl
				const nby = by / bl
				const ax = v.x - foot.x
				const ay = v.y - foot.y
				const al = Math.hypot(ax, ay) || 1
				const nax = ax / al
				const nay = ay / al
				const s = 14
				const p1 = { x: foot.x + nbx * s, y: foot.y + nby * s }
				const p2 = { x: foot.x + nax * s, y: foot.y + nay * s }
				const corner = { x: p1.x + nax * s, y: p1.y + nay * s }
				canvas.drawLine(p1.x, p1.y, corner.x, corner.y, { stroke: theme.colors.black, strokeWidth: theme.stroke.width.thick })
				canvas.drawLine(p2.x, p2.y, corner.x, corner.y, { stroke: theme.colors.black, strokeWidth: theme.stroke.width.thick })
			}
			if (alt.value) {
				const mid = { x: (v.x + foot.x) / 2, y: (v.y + foot.y) / 2 }
				// place slightly to one side of the segment
				const dx = foot.x - v.x
				const dy = foot.y - v.y
				const L = Math.hypot(dx, dy) || 1
				const nx = -dy / L
				const ny = dx / L
				const off = 14
				canvas.drawText({
					x: mid.x + nx * off,
					y: mid.y + ny * off,
					text: sideValueToString(alt.value),
					fill: theme.colors.black,
					anchor: "middle",
					dominantBaseline: "middle"
				})
			}
		}
	}

	// Collision helpers inspired by radially-constrained-angle-diagram
	function segmentIntersectsRect(
		Apt: { x: number; y: number },
		Bpt: { x: number; y: number },
		rect: { x: number; y: number; width: number; height: number; pad?: number }
	): boolean {
		const pad = rect.pad ?? 0
		const rx = rect.x - pad
		const ry = rect.y - pad
		const rw = rect.width + 2 * pad
		const rh = rect.height + 2 * pad
		const minX = Math.min(Apt.x, Bpt.x)
		const maxX = Math.max(Apt.x, Bpt.x)
		const minY = Math.min(Apt.y, Bpt.y)
		const maxY = Math.max(Apt.y, Bpt.y)
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
			segmentsIntersect(Apt, Bpt, r1, r2) ||
			segmentsIntersect(Apt, Bpt, r2, r3) ||
			segmentsIntersect(Apt, Bpt, r3, r4) ||
			segmentsIntersect(Apt, Bpt, r4, r1)
		)
	}

	function rectIntersectsAnySegment(rect: { x: number; y: number; width: number; height: number; pad?: number }): boolean {
		for (const seg of screenSegments) {
			if (segmentIntersectsRect(seg.a, seg.b, rect)) return true
		}
		return false
	}

	// Vertex labels A, B, C and point markers
	canvas.drawCircle(A.x, A.y, 5, { fill: theme.colors.black })
	canvas.drawCircle(B.x, B.y, 5, { fill: theme.colors.black })
	canvas.drawCircle(C.x, C.y, 5, { fill: theme.colors.black })

	function placePointLabel(pos: Vec, text: string, preferredAngleRad?: number) {
		const fontPx = vertexFont
		const { maxWidth: w, height: h } = estimateWrappedTextDimensions(text, Number.POSITIVE_INFINITY, fontPx, 1.2)
		const halfW = w / 2
		const halfH = h / 2
		let best = { x: pos.x, y: pos.y }
		let minCollisions = Number.POSITIVE_INFINITY
		// Build candidate angles prioritizing the preferred direction, then spread
		const angleCandidates: number[] = []
		if (typeof preferredAngleRad === "number") {
			angleCandidates.push(preferredAngleRad)
			angleCandidates.push(preferredAngleRad + Math.PI / 6, preferredAngleRad - Math.PI / 6)
			angleCandidates.push(preferredAngleRad + Math.PI / 3, preferredAngleRad - Math.PI / 3)
		}
		for (let i = 0; i < 8; i++) angleCandidates.push((i * Math.PI) / 4)
		for (const ang of angleCandidates) {
			for (const dist of [24, 34, 14, 44]) {
				const tx = pos.x + dist * Math.cos(ang)
				const ty = pos.y + dist * Math.sin(ang)
				const rect = { x: tx - halfW, y: ty - halfH, width: w, height: h, pad: 2 }
				const hits = rectIntersectsAnySegment(rect) ? 1 : 0
				if (hits < minCollisions) {
					minCollisions = hits
					best = { x: tx, y: ty }
				}
				if (minCollisions === 0) break
			}
			if (minCollisions === 0) break
		}
		canvas.drawText({ x: best.x, y: best.y, text, fill: theme.colors.black, anchor: "middle", dominantBaseline: "middle", fontPx, fontWeight: theme.font.weight.bold })
	}

	placePointLabel(A, points.A.label, preferredOppositeByVertex.get(points.A.id))
	placePointLabel(B, points.B.label, preferredOppositeByVertex.get(points.B.id))
	placePointLabel(C, points.C.label, preferredOppositeByVertex.get(points.C.id))

	// Draw markers and labels for extra points positioned via lines
	if (extraPoints) {
		for (const p of extraPoints) {
			const pos = idToPoint.get(p.id)
			if (!pos) continue
			canvas.drawCircle(pos.x, pos.y, 5, { fill: theme.colors.black })
			placePointLabel(pos, p.label)
		}
	}

	// Optional side labels (screen space)
	if (sideLabels) {
		const placeSideLabel = (
			p1: Vec,
			p2: Vec,
			lbl: z.infer<ReturnType<typeof createSideValueSchema>> | null
		) => {
			if (!lbl) return
			const mid = vecScale(vecAdd(p1, p2), 0.5)
			const dx = p2.x - p1.x
			const dy = p2.y - p1.y
			const len = Math.hypot(dx, dy)
			if (len === 0) return
			const nx = -dy / len
			const ny = dx / len
			const off = 20
			const lx = mid.x + nx * off
			const ly = mid.y + ny * off
			if (lbl.type === "mathml") {
				// Render MathML via foreignObject similar to number-line
				const fontPx = theme.font.size.large
				const labelWidth = 120
				const labelHeight = 32
				const xhtml = `<!DOCTYPE html><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;line-height:1;font-family:${theme.font.family.sans};color:${theme.colors.black};"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"inline\" style=\"font-size:${fontPx * 1.1}px;\">${lbl.mathml}</math></div>`
				canvas.drawForeignObject({ x: lx - labelWidth / 2, y: ly - labelHeight / 2, width: labelWidth, height: labelHeight, content: xhtml })
				return
			}
			canvas.drawText({ x: lx, y: ly, text: sideValueToString(lbl), fill: theme.colors.black, anchor: "middle", dominantBaseline: "middle" })
		}
		placeSideLabel(A, B, sideLabels.AB)
		placeSideLabel(B, C, sideLabels.BC)
		placeSideLabel(C, A, sideLabels.CA)
	}

	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)
	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}" font-size="${theme.font.size.medium}">${svgBody}</svg>`
}

