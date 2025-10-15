import { z } from "zod"
import * as errors from "@superbuilders/errors"
import type { WidgetGenerator } from "@/widgets/types"
import { CanvasImpl } from "@/widgets/utils/canvas-impl"
import { PADDING } from "@/widgets/utils/constants"
import { createHeightSchema, createWidthSchema } from "@/widgets/utils/schemas"
import { theme } from "@/widgets/utils/theme"

// -----------------------------
// Strip Diagram Schema
// -----------------------------

function createCellSchema() {
	return z
		.object({
			size: z
				.number()
				.positive()
				.describe(
					"The size of this cell in units. Must be positive. The width of the cell will be proportional to this size relative to the total size."
				),
			label: z
				.string()
				.nullable()
				.transform((v) => (v === "" || v === "null" || v === "NULL" ? null : v))
				.describe(
					"Optional label to display inside this cell. Null or empty string means no label. Keep concise to fit within the cell. Examples: '5', 'x', 'Part A'. Plain text only. IMPORTANT: When multiple cells have the same label (e.g., three cells all labeled 'x'), you MUST create separate cell objects for each - never combine or abbreviate repeating cells."
				)
		})
		.strict()
		.describe(
			"Defines a single cell within a row of the strip diagram. Each cell has a size (in abstract units) that determines its proportional width, and an optional label to display inside it."
		)
}

function createRowSchema() {
	return z
		.array(createCellSchema())
		.min(1)
		.describe(
			"Array of cells that make up a row in the strip diagram. Each cell's width is proportional to its size. The sum of all cell sizes should equal the totalSize. At least one cell is required per row. CRITICAL - NEVER SKIP REPEATING ELEMENTS: To represent 3x, you MUST create THREE separate cell objects each with label 'x' (NEVER one cell labeled '3x'). For 4x+8=32, create exactly four separate cells labeled 'x' plus one cell labeled '8'. Every single instance of a repeating element must be explicitly present in the array - no shortcuts, no abbreviations, no combining. If the diagram shows something five times, the array must contain five separate cell objects."
		)
}

export const StripDiagramPropsSchema = z
	.object({
		type: z
			.literal("stripDiagram")
			.describe("Identifies this as a strip diagram widget. Always use exactly 'stripDiagram'."),
		width: createWidthSchema(),
		height: createHeightSchema(),
		totalSize: z
			.number()
			.positive()
			.describe(
				"The total size in abstract units that each row should sum to. Both top and bottom rows must have cells whose sizes sum to this value. Common values: 10 for base-10 problems, 12 for dozens, or any whole number representing the total quantity."
			),
		topRow: createRowSchema().describe(
			"The cells that make up the top row of the strip diagram. Each cell's size determines its proportional width. Commonly used to show individual parts or segments. For algebraic equations like 3x+5=20, where we know that x has a  value of 5, represent as: [{size:5,label:'x'}, {size:5,label:'x'}, {size:5,label:'x'}, {size:5,label:'5'}]. Each variable instance gets its own cell."
		),
		bottomRow: createRowSchema().describe(
			"The cells that make up the bottom row of the strip diagram. Each cell's size determines its proportional width. Often contains a single cell representing the total, but can have multiple cells for comparisons."
		)
	})
	.strict()
	.describe(
		"Creates a strip diagram (also called a part-whole diagram) with two rows of proportionally-sized cells. This widget is ideal for visualizing part-whole relationships, fraction models, comparison problems, and algebraic equations. Each row contains one or more cells, where cell widths are proportional to their defined sizes. Common use cases: (1) Part-whole: top row shows several parts (e.g., three segments of sizes 3, 4, 5), bottom row shows the total (one segment of size 12). (2) Equations: For 3x+5=20, use top row with four cells [{size:5,label:'x'}, {size:5,label:'x'}, {size:5,label:'x'}, {size:5,label:'5'}] and bottom row [{size:20,label:'20'}]. CRITICAL RULE: Every instance of a repeating element MUST be explicitly included as a separate cell object in the array. Never abbreviate, combine, or skip repeating cells - if the source diagram shows an element 5 times, you must create 5 separate cell objects. The cells are rendered with borders and optional labels centered inside each cell."
	)

export type StripDiagramProps = z.infer<typeof StripDiagramPropsSchema>

// -----------------------------
// Validation
// -----------------------------

function validateRowSizes(row: z.infer<ReturnType<typeof createRowSchema>>, totalSize: number, rowName: string): void {
	const sum = row.reduce((acc, cell) => acc + cell.size, 0)
	if (Math.abs(sum - totalSize) > 0.0001) {
		throw errors.new(
			`${rowName} cells sum to ${sum} but totalSize is ${totalSize}. All cells in a row must sum to totalSize.`
		)
	}
}

// -----------------------------
// Generator
// -----------------------------

export const generateStripDiagram: WidgetGenerator<typeof StripDiagramPropsSchema> = async (props) => {
	const { width, height, totalSize, topRow, bottomRow } = props

	// Validate that row sizes sum to totalSize
	validateRowSizes(topRow, totalSize, "topRow")
	validateRowSizes(bottomRow, totalSize, "bottomRow")

	const canvas = new CanvasImpl({
		chartArea: { left: 0, top: 0, width, height },
		fontPxDefault: 12,
		lineHeightDefault: 1.2
	})

	const padding = PADDING
	const chartWidth = width - 2 * padding
	const rowHeight = 40
	const rowGap = 0

	const topY = padding + 20
	const bottomY = topY + rowHeight + rowGap

	function drawRow(row: z.infer<ReturnType<typeof createRowSchema>>, y: number): void {
		let currentX = padding

		for (const cell of row) {
			const cellWidth = (cell.size / totalSize) * chartWidth

			// Draw cell border
			canvas.drawRect(currentX, y, cellWidth, rowHeight, {
				fill: theme.colors.black,
				fillOpacity: 0,
				stroke: theme.colors.black,
				strokeWidth: theme.stroke.width.base
			})

			// Draw label if present
			if (cell.label) {
				canvas.drawText({
					x: currentX + cellWidth / 2,
					y: y + rowHeight / 2,
					text: cell.label,
					fill: theme.colors.black,
					anchor: "middle",
					dominantBaseline: "middle",
					fontWeight: theme.font.weight.bold
				})
			}

			currentX += cellWidth
		}
	}

	drawRow(topRow, topY)
	drawRow(bottomRow, bottomY)

	const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)
	return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}" font-size="${theme.font.size.base}">${svgBody}</svg>`
}

