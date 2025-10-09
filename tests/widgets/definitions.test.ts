import { describe, expect, test } from "bun:test"
import { allWidgetDefinitions } from "@/widgets/definitions"
import { allWidgetSchemas } from "@/widgets/registry"

describe("Widget Registry Parity", () => {
	test("allWidgetDefinitions and allWidgetSchemas should have the same keys", () => {
		const definitionKeys = Object.keys(allWidgetDefinitions).sort()
		const schemaKeys = Object.keys(allWidgetSchemas).sort()

		expect(definitionKeys).toEqual(schemaKeys)
	})
})
