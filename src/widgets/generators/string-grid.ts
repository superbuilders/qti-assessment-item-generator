import { z } from "zod"
import { CanvasImpl } from "../../utils/canvas-impl"
import { PADDING } from "../../utils/constants"
import { CSS_COLOR_PATTERN } from "../../utils/css-color"
import { theme } from "../../utils/theme"
import type { WidgetGenerator } from "../types"

// schema for a simple equal-cell grid of strings
export const StringGridPropsSchema = z
    .object({
        type: z.literal("stringGrid"),
        width: z.number().positive().describe("total svg width in pixels"),
        height: z.number().positive().describe("total svg height in pixels"),
        rows: z
            .number()
            .int()
            .positive()
            .describe("number of rows in the grid"),
        cols: z
            .number()
            .int()
            .positive()
            .describe("number of columns in the grid"),
        data: z
            .array(z.array(z.string()))
            .describe("row-major 2d array of cell strings"),
        showGridLines: z.boolean().default(true).describe("draw cell borders when true"),
        textColor: z
            .string()
            .regex(CSS_COLOR_PATTERN, "invalid css color")
            .default(theme.colors.text),
        borderColor: z
            .string()
            .regex(CSS_COLOR_PATTERN, "invalid css color")
            .default(theme.colors.border),
        fontPx: z
            .number()
            .int()
            .positive()
            .default(16)
            .describe("base font size in pixels for cell text")
    })
    .strict()

export type StringGridProps = z.infer<typeof StringGridPropsSchema>

export const generateStringGrid: WidgetGenerator<typeof StringGridPropsSchema> = async (props) => {
    const { width, height, rows, cols, data, showGridLines, textColor, borderColor, fontPx } = props

    const cellWidth = width / cols
    const cellHeight = height / rows

    const canvas = new CanvasImpl({
        chartArea: { left: 0, top: 0, width, height },
        fontPxDefault: fontPx,
        lineHeightDefault: 1.2
    })

    // draw text per cell
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * cellWidth
            const y = r * cellHeight
            // borders are drawn later so text stays centered above strokes
            const label = data[r]?.[c] ?? ""
            canvas.drawText({
                x: x + cellWidth / 2,
                y: y + cellHeight / 2,
                text: label,
                fontPx,
                anchor: "middle",
                dominantBaseline: "middle",
                fill: textColor
            })
        }
    }

    // optional grid lines on top
    if (showGridLines) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cellWidth
                const y = r * cellHeight
                canvas.drawRect(x, y, cellWidth, cellHeight, {
                    fill: "none",
                    stroke: borderColor,
                    strokeWidth: theme.stroke.width.base
                })
            }
        }
    }

    const { svgBody, vbMinX, vbMinY, width: finalWidth, height: finalHeight } = canvas.finalize(PADDING)
    return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="${vbMinX} ${vbMinY} ${finalWidth} ${finalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="${theme.font.family.sans}">${svgBody}</svg>`
}


