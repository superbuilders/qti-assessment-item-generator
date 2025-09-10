import { describe, expect, test } from "bun:test"
import { zodResponseFormat } from "openai/helpers/zod"
import { typedSchemas } from "../src/widgets/registry"

describe("Zod Schema to OpenAI JSON Schema Conversion", () => {
	for (const [widgetType, zodSchema] of Object.entries(typedSchemas)) {
		test(`should generate a zodResponseFormat for '${widgetType}' without any '$ref' properties`, () => {
			const responseFormat = zodResponseFormat(zodSchema, `zod_schema_for_${widgetType}`)
			const jsonSchema = responseFormat.json_schema?.schema
			const schemaString = JSON.stringify(jsonSchema, null, 2)
			expect(schemaString).not.toInclude('"$ref"')
		})
	}
})
