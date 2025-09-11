import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { Path2D } from "../../utils/path-builder"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

// Schema for an angle segment in the diagram.
const AngleSegmentSchema = z
	.object({
		fromRayLabel: z.string().describe("Label of the starting ray (e.g., 'A')."),
		toRayLabel: z.string().describe("Label of the ending ray (e.g., 'B')."),
		value: z
			.number()
			.min(1, "Angle value must be at least 1")
			.max(360, "Angle value cannot exceed 360")
			.describe("The measure of the angle in degrees."),
		color: z
			.string()
			.regex(CSS_COLOR_PATTERN, "Invalid CSS color format")
			.describe("The color for the angle's visual representation. Primary angles (adjacent rays) render as filled sectors, secondary angles (spanning multiple rays) render as stroke-only arcs."),
	})
	.strict()

// Main Zod schema for the radially-constrained-angle-diagram widget.
export const RadiallyConstrainedAngleDiagramPropsSchema = z
	.object({
		type: z
			.literal("radiallyConstrainedAngleDiagram")
			.describe("Identifies this as a radially constrained angle diagram."),
		width: z.number().positive().describe("The total width of the SVG diagram in pixels."),
		height: z.number().positive().describe("The total height of the SVG diagram in pixels."),
		centerLabel: z
			.string()
			.nullable()
			.transform((val) => (val === "" ? null : val))
			.describe("A nullable label for the center point (e.g., 'O')."),
		rayLabels: z
			.array(z.string())
			.min(2, "At least two ray labels are required.")
			.describe("Labels for all the rays in the diagram."),
		angles: z
			.array(AngleSegmentSchema)
			.min(1, "At least one angle is required.")
			.describe("An array of angle segments, each explicitly defining which rays it spans. Supports multiple layers: primary angles (adjacent rays) create filled sectors, secondary angles (spanning multiple rays) create arc overlays. Multiple secondary angles are automatically stacked at increasing radii."),
	})
	.strict()
	.describe(
		"Creates a diagram with rays originating from a central point, showing the angles between them. Each angle explicitly defines which rays it spans, making the relationships clear and unambiguous. Supports layered visualization: primary angles (between adjacent rays) appear as filled sectors, while secondary angles (spanning multiple rays) appear as arc overlays at different radii. Multiple secondary angles are automatically stacked for clear visual separation."
	)

export type RadiallyConstrainedAngleDiagramProps = z.infer<typeof RadiallyConstrainedAngleDiagramPropsSchema>

/**
 * Generates an SVG diagram of angles constrained around a central point.
 */
export const generateRadiallyConstrainedAngleDiagram: WidgetGenerator<
	typeof RadiallyConstrainedAngleDiagramPropsSchema
> = async (props) => {
	const { width, height, centerLabel, angles, rayLabels } = props

	// --- BEGIN RUNTIME INVARIANT VALIDATION ---
	// 0. Validate ray label uniqueness
	const rayLabelSet = new Set(rayLabels)
	if (rayLabelSet.size !== rayLabels.length) {
		logger.error("duplicate ray labels", { rayLabels })
		throw errors.new("ray labels must be unique")
	}
	// 1. Validate that all ray labels referenced in angles exist
	const labelToIndexMap = new Map(rayLabels.map((label, i) => [label, i]))
	for (const angle of angles) {
		const fromIndex = labelToIndexMap.get(angle.fromRayLabel)
		const toIndex = labelToIndexMap.get(angle.toRayLabel)

		if (fromIndex === undefined) {
			logger.error("invalid fromRayLabel in angle", { 
				fromRayLabel: angle.fromRayLabel, 
				availableLabels: rayLabels 
			})
			throw errors.new(`fromRayLabel '${angle.fromRayLabel}' not found in rayLabels`)
		}
		if (toIndex === undefined) {
			logger.error("invalid toRayLabel in angle", { 
				toRayLabel: angle.toRayLabel, 
				availableLabels: rayLabels 
			})
			throw errors.new(`toRayLabel '${angle.toRayLabel}' not found in rayLabels`)
		}
		if (fromIndex >= toIndex) {
			logger.error("invalid angle span", { 
				fromRayLabel: angle.fromRayLabel, 
				toRayLabel: angle.toRayLabel,
				fromIndex,
				toIndex
			})
			throw errors.new(`fromRayLabel '${angle.fromRayLabel}' must appear before toRayLabel '${angle.toRayLabel}' in rayLabels array`)
		}
	}

	// 2. Validate total angle constraint (PRIMARY angles only)
	// Secondary angles are visual helpers and must NOT be included in the total
	// because they span multiple primary angles.
	const tmpPrimaryCheck: typeof angles = []
	for (const angle of angles) {
		const fromIndex = labelToIndexMap.get(angle.fromRayLabel)!
		const toIndex = labelToIndexMap.get(angle.toRayLabel)!
		const rayDiff = Math.abs(toIndex - fromIndex)
		const isAdjacent = rayDiff === 1 || rayDiff === rayLabels.length - 1
		if (isAdjacent) tmpPrimaryCheck.push(angle)
	}
	const totalPrimaryAngle = tmpPrimaryCheck.reduce((sum, a) => sum + a.value, 0)
	if (totalPrimaryAngle <= 0 || totalPrimaryAngle >= 360) {
		logger.error("invalid total primary angle", { totalPrimaryAngle })
		throw errors.new("sum of primary angles must be less than 360 degrees")
	}
	// --- END RUNTIME INVARIANT VALIDATION ---

	const canvas = new CanvasImpl({
		chartArea: { left: 0, top: 0, width, height },
		fontPxDefault: 16,
		lineHeightDefault: 1.2,
	})

	const cx = width / 2
	const cy = height / 2

	const diagramRadius = Math.min(width, height) / 2 - PADDING * 2.5
	const pointOnRayDist = diagramRadius * 1.2

	// Calculate ray positions from primary angle values (literal geometry)
	// Build a lookup for primary angles between consecutive rays
	const primaryBetween: Record<string, number> = {}
	for (const angle of angles) {
		const fromIndex = labelToIndexMap.get(angle.fromRayLabel)!
		const toIndex = labelToIndexMap.get(angle.toRayLabel)!
		const rayDiff = Math.abs(toIndex - fromIndex)
		const isAdjacent = rayDiff === 1 || rayDiff === rayLabels.length - 1
		if (!isAdjacent) continue
		// Only accept forward adjacent in the array order (i -> i+1). Wrap-around is treated as the remaining gap.
		if (toIndex === fromIndex + 1) {
			const key = `${angle.fromRayLabel}->${angle.toRayLabel}`
			if (primaryBetween[key] !== undefined) {
				logger.error("duplicate primary angle between adjacent rays", { key })
				throw errors.new("duplicate primary angle between adjacent rays")
			}
			primaryBetween[key] = angle.value
		}
	}

	// Ensure every consecutive pair (except wrap-around) has a primary value
	for (let i = 0; i < rayLabels.length - 1; i++) {
		const from = rayLabels[i]
		const to = rayLabels[i + 1]
		const key = `${from}->${to}`
		if (primaryBetween[key] === undefined) {
			logger.error("missing primary angle between adjacent rays", { from, to })
			throw errors.new("missing primary angle between adjacent rays")
		}
	}

	// Center the drawing around -90 degrees (top) using total of primary angles
	const startAngleDeg = -90 - totalPrimaryAngle / 2
	const rayAnglesDeg: number[] = new Array(rayLabels.length)
	rayAnglesDeg[0] = startAngleDeg
	for (let i = 0; i < rayLabels.length - 1; i++) {
		const key = `${rayLabels[i]}->${rayLabels[i + 1]}`
		rayAnglesDeg[i + 1] = rayAnglesDeg[i] + primaryBetween[key]
	}

	const rayPositions = rayLabels.map((label, i) => {
		const angleDeg = rayAnglesDeg[i]
		const angleRad = (angleDeg * Math.PI) / 180
		return {
			label,
			index: i,
			angleRad,
			angleDeg,
			x: cx + pointOnRayDist * Math.cos(angleRad),
			y: cy + pointOnRayDist * Math.sin(angleRad),
		}
	})

	// Separate angles into primary (adjacent rays) and secondary (spanning multiple rays)
	const primaryAngles: typeof angles = []
	const secondaryAngles: typeof angles = []

	for (const angle of angles) {
		const fromRay = rayPositions.find(r => r.label === angle.fromRayLabel)!
		const toRay = rayPositions.find(r => r.label === angle.toRayLabel)!
		
		// Primary angle: adjacent rays (difference of 1 in the rayLabels array)
		const rayDiff = Math.abs(toRay.index - fromRay.index)
		const isAdjacent = rayDiff === 1 || rayDiff === rayLabels.length - 1 // Handle wrap-around
		
		if (isAdjacent) {
			primaryAngles.push(angle)
		} else {
			secondaryAngles.push(angle)
		}
	}

	// Draw primary angles as filled sectors (inner) UNDER rays
	const primaryArcRadius = diagramRadius * 0.4
	const primaryLabelRadius = primaryArcRadius + 28
	const pendingPrimaryLabels: Array<{ x: number; y: number; text: string }> = []

	for (const angle of primaryAngles) {
		const fromRay = rayPositions.find(r => r.label === angle.fromRayLabel)!
		const toRay = rayPositions.find(r => r.label === angle.toRayLabel)!
		
		const fromRad = fromRay.angleRad
		const toRad = toRay.angleRad
		
		// Calculate angle span (always go clockwise from fromRay to toRay)
		let angleDiff = toRad - fromRad
		if (angleDiff <= 0) {
			angleDiff += 2 * Math.PI
		}
		
		const startPoint = { x: cx + primaryArcRadius * Math.cos(fromRad), y: cy + primaryArcRadius * Math.sin(fromRad) }
		const endPoint = { x: cx + primaryArcRadius * Math.cos(toRad), y: cy + primaryArcRadius * Math.sin(toRad) }
		
		const largeArcFlag = angleDiff > Math.PI ? 1 : 0
		const path = new Path2D()
			.moveTo(cx, cy)
			.lineTo(startPoint.x, startPoint.y)
			.arcTo(primaryArcRadius, primaryArcRadius, 0, largeArcFlag, 1, endPoint.x, endPoint.y)
			.closePath()
		canvas.drawPath(path, { fill: angle.color, stroke: "none" })
		
		// Defer label drawing until after rays so labels sit above
		const midAngleRad = fromRad + angleDiff / 2
		const labelX = cx + primaryLabelRadius * Math.cos(midAngleRad)
		const labelY = cy + primaryLabelRadius * Math.sin(midAngleRad)
		pendingPrimaryLabels.push({ x: labelX, y: labelY, text: `${angle.value}°` })
	}

	// Draw secondary angles as internal arcs UNDER rays (between primary sectors and ray endpoints)
	// Choose a radius band strictly inside the ray length and above the primary labels
	const innerArcMinRadius = primaryLabelRadius + 14
	const innerArcMaxRadius = pointOnRayDist - 24
	const suggestedBase = diagramRadius * 0.7
	const baseSecondaryRadius = Math.max(innerArcMinRadius, Math.min(innerArcMaxRadius, suggestedBase))
	const radiusStep = 18
	const pendingSecondaryLabels: Array<{ x: number; y: number; text: string }> = []

	secondaryAngles.forEach((angle, i) => {
		const fromRay = rayPositions.find(r => r.label === angle.fromRayLabel)!
		const toRay = rayPositions.find(r => r.label === angle.toRayLabel)!
		
		const fromRad = fromRay.angleRad
		const toRad = toRay.angleRad
		
		// Calculate angle span (always go clockwise from fromRay to toRay)
		let angleDiff = toRad - fromRad
		if (angleDiff <= 0) {
			angleDiff += 2 * Math.PI
		}
		
		let secondaryRadius = baseSecondaryRadius + i * radiusStep
		if (secondaryRadius > innerArcMaxRadius) {
			secondaryRadius = innerArcMaxRadius
		}
		const startPoint = { x: cx + secondaryRadius * Math.cos(fromRad), y: cy + secondaryRadius * Math.sin(fromRad) }
		const endPoint = { x: cx + secondaryRadius * Math.cos(toRad), y: cy + secondaryRadius * Math.sin(toRad) }
		
		const largeArcFlag = angleDiff > Math.PI ? 1 : 0
		const arcPath = new Path2D()
			.moveTo(startPoint.x, startPoint.y)
			.arcTo(secondaryRadius, secondaryRadius, 0, largeArcFlag, 1, endPoint.x, endPoint.y)
		
		canvas.drawPath(arcPath, { 
			stroke: angle.color, 
			strokeWidth: theme.stroke.width.thick, 
			fill: "none" 
		})
		
		// Defer label drawing until after rays
		const midAngleRad = fromRad + angleDiff / 2
		const labelRadius = Math.min(innerArcMaxRadius, secondaryRadius + 16)
		const labelX = cx + labelRadius * Math.cos(midAngleRad)
		const labelY = cy + labelRadius * Math.sin(midAngleRad)
		pendingSecondaryLabels.push({ x: labelX, y: labelY, text: `${angle.value}°` })
	})

	// Draw rays and ray labels ON TOP of sectors/arcs
	for (const ray of rayPositions) {
		// Draw ray line
		canvas.drawLine(cx, cy, ray.x, ray.y, { 
			stroke: theme.colors.black, 
			strokeWidth: theme.stroke.width.thick 
		})
		
		// Draw point at end of ray
		canvas.drawCircle(ray.x, ray.y, 4, { fill: theme.colors.black })
		
		// Draw ray label
		const labelDistFromPoint = 22
		const rayLabelX = cx + (pointOnRayDist + labelDistFromPoint) * Math.cos(ray.angleRad)
		const rayLabelY = cy + (pointOnRayDist + labelDistFromPoint) * Math.sin(ray.angleRad)
		canvas.drawText({
			x: rayLabelX, y: rayLabelY, text: ray.label,
			fill: theme.colors.black, anchor: "middle", dominantBaseline: "middle",
			fontPx: 20, fontWeight: theme.font.weight.bold,
		})
	}

	// Finally, draw angle labels ON TOP of rays
	[...pendingPrimaryLabels, ...pendingSecondaryLabels].forEach(lbl => {
		canvas.drawText({
			x: lbl.x, y: lbl.y, text: lbl.text,
			fill: theme.colors.black, anchor: "middle", dominantBaseline: "middle",
			fontPx: 18, fontWeight: theme.font.weight.bold,
		})
	})

	// Draw the center point and its label last to be on top
	canvas.drawCircle(cx, cy, 6, { fill: theme.colors.black })
	if (centerLabel) {
		// Position center label below the center point by default
		const labelDistance = 25
		const labelX = cx
		const labelY = cy + labelDistance
		canvas.drawText({
			x: labelX, y: labelY, text: centerLabel, fill: theme.colors.black,
			fontPx: 20, fontWeight: theme.font.weight.bold, anchor: "middle", dominantBaseline: "middle"
		})
	}

	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)

	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}">${svgBody}</svg>`
}