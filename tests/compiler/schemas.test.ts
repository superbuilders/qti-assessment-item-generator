import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import {
	createAssessmentItemShellSchema,
	createBlockContentItemSchema,
	createBlockContentSchema,
	createDynamicAssessmentItemSchema,
	createInlineContentItemSchema,
	createInlineContentSchema
} from "../../src/compiler/schemas"
import { toJSONSchemaPromptSafe } from "../../src/structured/json-schema"
import { createWidgetTypeEnumFromCollection } from "../../src/structured/schemas"
import { allWidgetsCollection } from "../../src/widgets/collections/all"
import type { typedSchemas } from "../../src/widgets/registry"

describe("Compiler Schema Factories", () => {
	const widgetEnum = createWidgetTypeEnumFromCollection(allWidgetsCollection)

	test("createInlineContentItemSchema produces valid JSON Schema", () => {
		const schema = createInlineContentItemSchema(widgetEnum)
		expect(schema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(schema))
		if (result.error) {
			logger.error("inline content item schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "inline content item schema json conversion")
		}
		expect(result.error).toBeFalsy()
		const json = result.data as Record<string, unknown>
		expect(json).toBeDefined()
	})

	test("createInlineContentSchema produces valid JSON Schema", () => {
		const schema = createInlineContentSchema(widgetEnum)
		expect(schema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(schema))
		if (result.error) {
			logger.error("inline content schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "inline content schema json conversion")
		}
		expect(result.error).toBeFalsy()
		const json = result.data as Record<string, unknown>
		expect(json.type).toBe("array")
	})

	test("createBlockContentItemSchema produces valid JSON Schema", () => {
		const schema = createBlockContentItemSchema(widgetEnum)
		expect(schema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(schema))
		if (result.error) {
			logger.error("block content item schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "block content item schema json conversion")
		}
		expect(result.error).toBeFalsy()
		const json = result.data as Record<string, unknown>
		expect(json).toBeDefined()
	})

	test("createBlockContentSchema produces valid JSON Schema", () => {
		const schema = createBlockContentSchema(widgetEnum)
		expect(schema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(schema))
		if (result.error) {
			logger.error("block content schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "block content schema json conversion")
		}
		expect(result.error).toBeFalsy()
		const json = result.data as Record<string, unknown>
		expect(json.type).toBe("array")
	})

	test("createAssessmentItemShellSchema produces valid JSON Schema", () => {
		const schema = createAssessmentItemShellSchema(widgetEnum)
		expect(schema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(schema))
		if (result.error) {
			logger.error("shell schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "shell schema json conversion")
		}
		expect(result.error).toBeFalsy()
		const json = result.data as Record<string, unknown>
		expect(json.type).toBe("object")
		expect(json.properties).toBeDefined()
	})

	test("createDynamicAssessmentItemSchema produces valid JSON Schema", () => {
		const widgetMapping: Record<string, keyof typeof typedSchemas> = {
			widget_1: "barChart",
			widget_2: "numberLine"
		}

		const { AssessmentItemSchema, AnyInteractionSchema, AssessmentItemShellSchema } = createDynamicAssessmentItemSchema(
			widgetMapping,
			widgetEnum
		)

		expect(AssessmentItemSchema).toBeDefined()
		expect(AnyInteractionSchema).toBeDefined()
		expect(AssessmentItemShellSchema).toBeDefined()

		const itemResult = errors.trySync(() => toJSONSchemaPromptSafe(AssessmentItemSchema))
		if (itemResult.error) {
			logger.error("assessment item schema json conversion", { error: itemResult.error })
			throw errors.wrap(itemResult.error, "assessment item schema json conversion")
		}
		expect(itemResult.error).toBeFalsy()
		const itemJson = itemResult.data as Record<string, unknown>
		expect(itemJson.type).toBe("object")
		expect(itemJson.properties).toBeDefined()

		const interactionResult = errors.trySync(() => toJSONSchemaPromptSafe(AnyInteractionSchema))
		if (interactionResult.error) {
			logger.error("any interaction schema json conversion", { error: interactionResult.error })
			throw errors.wrap(interactionResult.error, "any interaction schema json conversion")
		}
		expect(interactionResult.error).toBeFalsy()

		const shellResult = errors.trySync(() => toJSONSchemaPromptSafe(AssessmentItemShellSchema))
		if (shellResult.error) {
			logger.error("shell schema json conversion", { error: shellResult.error })
			throw errors.wrap(shellResult.error, "shell schema json conversion")
		}
		expect(shellResult.error).toBeFalsy()
		const shellJson = shellResult.data as Record<string, unknown>
		expect(shellJson.type).toBe("object")
	})

	test("createDynamicAssessmentItemSchema throws on unknown widget type", () => {
		const badMapping: Record<string, keyof typeof typedSchemas> = {
			widget_1: "unknownType" as keyof typeof typedSchemas
		}

		expect(() => createDynamicAssessmentItemSchema(badMapping, widgetEnum)).toThrow("unknown widget type")
	})
})
