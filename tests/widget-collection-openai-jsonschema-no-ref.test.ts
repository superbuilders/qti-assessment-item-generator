import { describe, expect, test } from "bun:test"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { allWidgetSchemas } from "../src/widgets/registry"

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value)
}

function assertNoDefaults(node: unknown): void {
	if (isRecord(node)) {
		expect(node).not.toHaveProperty("default")
		for (const value of Object.values(node)) assertNoDefaults(value)
	} else if (Array.isArray(node)) {
		for (const value of node) assertNoDefaults(value)
	}
}

describe("Widget collection OpenAI JSON Schema (no $ref, no defaults)", () => {
	test("composite widget schema should not emit $ref or defaults", () => {
		const WidgetCollectionSchema = z
			.object({
				widget_1: allWidgetSchemas.barChart,
				widget_2: allWidgetSchemas.angleDiagram,
				widget_3: allWidgetSchemas.numberLine,
				widget_4: allWidgetSchemas.circleDiagram,
				widget_5: allWidgetSchemas.lineDiagram
			})
			.describe("Composite widget collection for OpenAI structured output")

		const responseFormat = zodResponseFormat(WidgetCollectionSchema, "widget_content_generator_test")
		const jsonSchema = responseFormat.json_schema?.schema
		expect(jsonSchema).toBeDefined()

		const schemaString = JSON.stringify(jsonSchema, null, 2)
		expect(schemaString).not.toInclude('"$ref"')
		assertNoDefaults(jsonSchema)
	})
})
