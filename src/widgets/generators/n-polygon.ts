import { z } from "zod"
import { CanvasImpl } from "../utils/canvas-impl"
import { PADDING } from "../utils/constants"
import { CSS_COLOR_PATTERN } from "../utils/css-color"
import { createHeightSchema, createWidthSchema } from "../utils/schemas"
import type { WidgetGenerator } from "../types"

export const NPolygonPropsSchema = z
	.object({
		type: z
			.literal("nPolygon")
			.describe(
				"Renders one or more polygon shapes horizontally. Use this widget for regular polygons (regularTriangle, regularSquare, regularPentagon, regularHexagon, regularHeptagon, regularOctagon), rectangle, and specialized forms (rightTrapezoid, pentagonTwoConsecutiveRightAngles), either individually or side-by-side for comparison."
			),
		width: createWidthSchema(),
		height: createHeightSchema(),
		polygons: z
			.array(
				z.object({
					shape: z
						.enum([
							"regularTriangle",
							"regularSquare",
							"rectangle",
							"regularPentagon",
							"regularHexagon",
							"regularHeptagon",
							"regularOctagon",
							"rightTrapezoid",
							"pentagonTwoConsecutiveRightAngles"
						])
						.describe(
							"The specific polygon shape to render. Regular variants render equilateral/equiangular polygons (regularTriangle, regularSquare, regularPentagon, regularHexagon, regularHeptagon, regularOctagon). Rectangle uses a 4:3 aspect ratio. rightTrapezoid is a quadrilateral with exactly one pair of parallel sides and two right angles. pentagonTwoConsecutiveRightAngles is a pentagon with two adjacent right-angle vertices (house shape)."
						),
					fillColor: z
						.string()
						.regex(CSS_COLOR_PATTERN, "invalid css color; use hex (#RGB, #RRGGBB, #RRGGBBAA)")
						.describe("The hex-only fill color for this polygon.")
				})
			)
			.min(1)
			.describe(
				"Array of polygon definitions. Can contain a single polygon or multiple polygons to display side-by-side with automatic spacing. Each polygon is centered within its allocated horizontal space."
			)
	})
	.strict()
	.describe(
		"Renders one or more filled polygons with a black border, placed side by side with sensible internal spacing. Supports regularTriangle, regularSquare, rectangle, regularPentagon, regularHexagon, regularHeptagon, regularOctagon. Also supports rightTrapezoid (one parallel pair, two right angles) and pentagonTwoConsecutiveRightAngles (house shape). Rectangle uses a 4:3 aspect inside its tile; other listed regulars are fitted in their tile."
	)

export type NPolygonProps = z.infer<typeof NPolygonPropsSchema>

export const generateNPolygon: WidgetGenerator<typeof NPolygonPropsSchema> = async (props) => {
	const { width, height, polygons } = props

	const canvas = new CanvasImpl({
		chartArea: { left: 0, top: 0, width, height },
		fontPxDefault: 12,
		lineHeightDefault: 1.2
	})

	const tileCount = polygons.length
	const INTERNAL_SPACING = PADDING * 2
	const totalSpacing = INTERNAL_SPACING * Math.max(0, tileCount - 1)
	const tileWidth = (width - totalSpacing) / tileCount
	const tileHeight = height

	function drawSinglePolygon(
		tileLeft: number,
		tileTop: number,
		tileW: number,
		tileH: number,
		shape: (typeof polygons)[number]["shape"],
		fillColor: string
	): void {
		const cx = tileLeft + tileW / 2
		const cy = tileTop + tileH / 2
		const radius = Math.min(tileW, tileH) / 2 - PADDING

		function isRegularShape(
			s: (typeof polygons)[number]["shape"]
		): s is
			| "regularTriangle"
			| "regularSquare"
			| "regularPentagon"
			| "regularHexagon"
			| "regularHeptagon"
			| "regularOctagon" {
			return (
				s === "regularTriangle" ||
				s === "regularSquare" ||
				s === "regularPentagon" ||
				s === "regularHexagon" ||
				s === "regularHeptagon" ||
				s === "regularOctagon"
			)
		}

		const regularSides: Record<
			"regularTriangle" | "regularSquare" | "regularPentagon" | "regularHexagon" | "regularHeptagon" | "regularOctagon",
			number
		> = {
			regularTriangle: 3,
			regularSquare: 4,
			regularPentagon: 5,
			regularHexagon: 6,
			regularHeptagon: 7,
			regularOctagon: 8
		}

		const points: Array<{ x: number; y: number }> = []

		switch (shape) {
			case "rectangle": {
				const availableWidth = tileW - 2 * PADDING
				const availableHeight = tileH - 2 * PADDING
				const aspectRatio = 4 / 3
				let rectWidth = availableWidth
				let rectHeight = rectWidth / aspectRatio
				if (rectHeight > availableHeight) {
					rectHeight = availableHeight
					rectWidth = rectHeight * aspectRatio
				}
				const halfWidth = rectWidth / 2
				const halfHeight = rectHeight / 2
				points.push(
					{ x: cx - halfWidth, y: cy - halfHeight },
					{ x: cx + halfWidth, y: cy - halfHeight },
					{ x: cx + halfWidth, y: cy + halfHeight },
					{ x: cx - halfWidth, y: cy + halfHeight }
				)
				break
			}
			case "rightTrapezoid": {
				// Deterministic right trapezoid: horizontal bases, left leg vertical → two right angles
				const availableWidth = tileW - 2 * PADDING
				const availableHeight = tileH - 2 * PADDING
				const baseBottom = Math.min(availableWidth, availableHeight * 1.4)
				const baseTop = baseBottom * 0.65
				const height = Math.min(availableHeight, baseBottom * 0.6)
				const leftX = cx - baseBottom / 2
				const rightXBottom = cx + baseBottom / 2
				const rightXTop = leftX + baseTop // slanted right leg
				const topY = cy - height / 2
				const bottomY = cy + height / 2
				points.push(
					{ x: leftX, y: topY }, // top-left
					{ x: rightXTop, y: topY }, // top-right (shorter top base)
					{ x: rightXBottom, y: bottomY }, // bottom-right
					{ x: leftX, y: bottomY } // bottom-left (vertical left leg)
				)
				break
			}
			case "pentagonTwoConsecutiveRightAngles": {
				// House-shaped pentagon with two consecutive right angles at bottom corners
				const availableWidth = tileW - 2 * PADDING
				const availableHeight = tileH - 2 * PADDING
				const baseWidth = Math.min(availableWidth, availableHeight * 1.6)
				const wallHeight = Math.min(availableHeight * 0.45, baseWidth * 0.45)
				const roofHeight = Math.min(availableHeight * 0.35, baseWidth * 0.35)
				const leftX = cx - baseWidth / 2
				const rightX = cx + baseWidth / 2
				const bottomY = cy + Math.max(0, (availableHeight - (wallHeight + roofHeight)) / 2)
				const topWallY = bottomY - wallHeight
				const roofApexY = topWallY - roofHeight
				const apexX = cx
				points.push(
					{ x: leftX, y: bottomY }, // bottom-left (right angle)
					{ x: rightX, y: bottomY }, // bottom-right (right angle) — consecutive to bottom-left
					{ x: rightX, y: topWallY }, // right wall top
					{ x: apexX, y: roofApexY }, // roof apex
					{ x: leftX, y: topWallY } // left wall top
				)
				break
			}
			default: {
				if (isRegularShape(shape)) {
					const numSides = regularSides[shape]
					const angleOffset = shape === "regularSquare" ? Math.PI / 4 : -Math.PI / 2
					for (let i = 0; i < numSides; i++) {
						const angle = (i / numSides) * 2 * Math.PI + angleOffset
						points.push({
							x: cx + radius * Math.cos(angle),
							y: cy + radius * Math.sin(angle)
						})
					}
				}
				break
			}
		}

		canvas.drawPolygon(points, {
			fill: fillColor,
			stroke: "#000000",
			strokeWidth: 2
		})
	}

	for (let index = 0; index < polygons.length; index++) {
		const poly = polygons[index]
		if (!poly) continue
		const tileLeft = index * (tileWidth + INTERNAL_SPACING)
		drawSinglePolygon(tileLeft, 0, tileWidth, tileHeight, poly.shape, poly.fillColor)
	}

	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)

	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg">${svgBody}</svg>`
}
