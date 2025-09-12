import { z } from "zod";
import { theme } from "../../utils/theme";
import type { WidgetGenerator } from "../types";

// Using factories to prevent Zod from creating schemas with $refs, which can cause issues with some tools.

/**
 * Defines a value for the quotient row, which can either be a known string value
 * or a placeholder box indicating a missing number to be filled in.
 */
const createValueOrPlaceholderSchema = () => z.discriminatedUnion("type", [
    z.object({
        type: z.literal("value").describe("A known numeric value."),
        value: z.number().describe("The numeric value to display (e.g., 10, 7).")
    }),
    z.object({
        type: z.literal("placeholder").describe("An unknown value represented by an empty box.")
    })
]).describe("Represents either a known value or a placeholder box.");

/**
 * Defines a single calculation step within a column of the area model, including
 * the numbers to be subtracted and the resulting difference.
 */
const createStepSchema = () => z.object({
    subtrahend: z.number().nullable().describe("The value being subtracted in this step (e.g., 30). Null to hide."),
    difference: z.number().nullable().describe("The result of the subtraction (e.g., 21). Null to hide."),
    differenceColor: z.string().nullable().describe("Optional CSS color for the difference text (e.g., 'red'). Null for default color.")
}).strict();

/**
 * Main Zod schema for the divisionAreaDiagram widget.
 *
 * This widget creates a visual area model for long division, commonly used in elementary
 * and middle school math to teach the partial quotients method. The diagram is structured
 * like a box, with the divisor on the left, the dividend inside, and partial quotients
 * along the top. Each step of the division process is shown as a subtraction within a
 * column of the model.
 *
 * The schema is designed to be flexible, allowing for the rendering of problems at
 * various stages of completion, including initial setup with placeholders, intermediate
 * steps with calculations, and the final solved state.
 */
export const DivisionAreaDiagramPropsSchema = z.object({
    type: z.literal("divisionAreaDiagram"),
    divisor: z.number().describe("The divisor, displayed on the left side of the model."),
    dividend: z.number().describe("The initial dividend, displayed in the first column."),
    quotientParts: z.array(createValueOrPlaceholderSchema()).describe("An array of quotient parts displayed across the top."),
    steps: z.array(createStepSchema()).describe("An array of calculation steps. Its length must match quotientParts."),
    showFinalRemainderBox: z.boolean().default(false).describe("If true, shows the final zero remainder with a box around it.")
}).strict().describe("Creates a visual area model for long division, showing partial quotients and step-by-step subtraction.");

export type DivisionAreaDiagramProps = z.infer<typeof DivisionAreaDiagramPropsSchema>;

/**
 * Generates an HTML table representing a division area model.
 */
export const generateDivisionAreaDiagram: WidgetGenerator<typeof DivisionAreaDiagramPropsSchema> = async (props) => {
    const { divisor, dividend, quotientParts, steps, showFinalRemainderBox } = props;

    // Helper to render string content, optionally with a color.
    const renderContent = (content: string | number | null, color?: string | null): string => {
        if (content === null) return '&nbsp;';
        const text = typeof content === "number" ? String(content) : content;
        // Simple HTML escaping for numbers/operators
        const escapedContent = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const style = color ? `color: ${color};` : '';
        // Using a span to ensure styling is applied correctly.
        return `<span style="${style}">${escapedContent}</span>`;
    };

    // Helper to render a placeholder box.
    const renderPlaceholder = (): string => {
        return `<div style="width: 40px; height: 24px; border: 1.5px solid ${theme.colors.border}; margin: auto;"></div>`;
    };
    
    // Main table wrapper
    let html = `<div style="display: inline-block; font-family: ${theme.font.family.sans}; font-size: 1.2em;">`;
    html += `<table cellpadding="10" align="center" style="border: none; border-collapse: collapse; margin: auto;">`;
    html += '<tbody>';

    // Top Row: Quotient Parts
    html += '<tr>';
    // Top-left corner spacer (no borders to avoid visible corner artifact)
    html += `<td style="width: 40px; height: 40px; border: none; padding: 0;"></td>`;
    quotientParts.forEach(part => {
        const content = part.type === 'value' ? renderContent(part.value) : renderPlaceholder();
        const style = `width: 80px; height: 40px; background-color: #EBF5FB; text-align:center; padding: 10px;`;
        html += `<td style="${style}">${content}</td>`;
    });
    html += '</tr>';

    // Main Row: Divisor and Steps
    html += '<tr>';
    
    // Divisor Cell
    html += `<td style="vertical-align: top; text-align: right; padding: 0; padding-right: 5px;">`;
    html += `<div style="padding: 12px; background-color: #EBF5FB; display: inline-block; margin-top: 5px;">${renderContent(divisor)}</div>`;
    html += `</td>`;

    // Steps Cells
    let currentDividend = dividend;
    steps.forEach((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const borderStyle = `border-top: 1.5px solid black; border-bottom: 1.5px solid black;${isFirst ? " border-left: 1.5px solid black;" : ""}${isLast ? " border-right: 1.5px solid black;" : ""}`;
        html += `<td style="width: 80px; vertical-align: top; text-align: center; padding: 5px; ${borderStyle}">`;
        // Inner table for this step's calculation
        html += `<table cellpadding="0" align="center" style="width: 100%; border: none; border-collapse: collapse;"><tbody>`;
        
        // Dividend for this step
        html += `<tr><td colspan="2" style="text-align:center; padding: 8px 5px;">${renderContent(currentDividend)}</td></tr>`;
        
        if (step.subtrahend !== null) {
            // Subtraction line
            html += `<tr style="border-bottom: 1.5px solid black;">`;
            html += `<td style="text-align:right; padding: 2px 2px 2px 0;">${renderContent('−')}</td>`;
            html += `<td style="text-align:left; padding: 2px 0 2px 2px;">${renderContent(step.subtrahend)}</td>`;
            html += `</tr>`;

            if (step.difference !== null) {
                // Difference (remainder)
                html += `<tr><td colspan="2" style="text-align:center; padding: 8px 5px;">`;
                if (showFinalRemainderBox && index === steps.length - 1 && step.difference === 0) {
                     html += `<div style="border: 1.5px solid black; display: inline-block; padding: 1px 8px;">${renderContent(step.difference)}</div>`;
                } else {
                    html += renderContent(step.difference, step.differenceColor);
                }
                 html += `</td></tr>`;
            }
        }

        html += `</tbody></table></td>`;
        
        // The difference of this step becomes the dividend of the next.
        if (step.difference !== null) {
            currentDividend = step.difference;
        }
    });

    html += '</tr>';
    html += '</tbody></table></div>';
    
    return html;
};