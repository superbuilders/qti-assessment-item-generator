import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { toJSONSchemaPromptSafe } from "../../src/structured/json-schema"
import {
	createCollectionScopedFeedbackSchema,
	createCollectionScopedInteractionSchema,
	createCollectionScopedItemSchema,
	createCollectionScopedShellSchema,
	createWidgetTypeEnumFromCollection
} from "../../src/structured/schemas"
import { allWidgetsCollection } from "../../src/widgets/collections/all"

describe("Structured Schemas JSON Schema Generation", () => {
	test("createWidgetTypeEnumFromCollection produces valid enum", () => {
		const enumSchema = createWidgetTypeEnumFromCollection(allWidgetsCollection)
		expect(enumSchema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(enumSchema))
		if (result.error) {
			logger.error("widget type enum json conversion", { error: result.error })
			throw errors.wrap(result.error, "widget type enum json conversion")
		}
		expect(result.error).toBeFalsy()
		expect(result.data).toBeDefined()
	})

	test("createCollectionScopedShellSchema produces valid JSON Schema", () => {
		const shellSchema = createCollectionScopedShellSchema(allWidgetsCollection)
		expect(shellSchema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(shellSchema))
		if (result.error) {
			logger.error("shell schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "shell schema json conversion")
		}
		expect(result.error).toBeFalsy()
		expect(result.data).toBeDefined()

		const json = result.data
		expect(typeof json).toBe("object")
		expect(json).not.toBeNull()
		if (typeof json === "object" && json !== null && "type" in json && "properties" in json) {
			expect(json.type).toBe("object")
			expect(json.properties).toBeDefined()
		}
	})

	test("createCollectionScopedInteractionSchema produces valid JSON Schema", () => {
		const interactionIds = ["interaction_1", "interaction_2"]
		const interactionSchema = createCollectionScopedInteractionSchema(interactionIds, allWidgetsCollection)
		expect(interactionSchema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(interactionSchema))
		if (result.error) {
			logger.error("interaction schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "interaction schema json conversion")
		}
		expect(result.error).toBeFalsy()
		expect(result.data).toBeDefined()

		const json = result.data
		expect(typeof json).toBe("object")
		expect(json).not.toBeNull()
		if (typeof json === "object" && json !== null && "type" in json) {
			expect(json.type).toBe("object")
		}
	})

	test("createCollectionScopedFeedbackSchema produces valid JSON Schema", () => {
		const feedbackPlan = {
			mode: "combo" as const,
			dimensions: [{ responseIdentifier: "RESPONSE", kind: "binary" as const }],
			combinations: [
				{ id: "FB__RESPONSE_CORRECT", path: [{ responseIdentifier: "RESPONSE", key: "CORRECT" }] },
				{ id: "FB__RESPONSE_INCORRECT", path: [{ responseIdentifier: "RESPONSE", key: "INCORRECT" }] }
			]
		}
		const FeedbackSchema = createCollectionScopedFeedbackSchema(feedbackPlan, allWidgetsCollection)
		expect(FeedbackSchema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(FeedbackSchema))
		if (result.error) {
			logger.error("feedback schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "feedback schema json conversion")
		}
		expect(result.error).toBeFalsy()
		expect(result.data).toBeDefined()

		const json = result.data
		expect(typeof json).toBe("object")
		expect(json).not.toBeNull()
		if (typeof json === "object" && json !== null && "type" in json && "properties" in json) {
			expect(json.type).toBe("object")
			expect(json.properties).toBeDefined()
		}
	})

	test("createCollectionScopedItemSchema produces valid JSON Schema", () => {
		const itemSchema = createCollectionScopedItemSchema(allWidgetsCollection)
		expect(itemSchema).toBeDefined()

		const result = errors.trySync(() => toJSONSchemaPromptSafe(itemSchema))
		if (result.error) {
			logger.error("item schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "item schema json conversion")
		}
		expect(result.error).toBeFalsy()
		expect(result.data).toBeDefined()

		const json = result.data
		expect(typeof json).toBe("object")
		expect(json).not.toBeNull()
		if (typeof json === "object" && json !== null && "type" in json && "properties" in json) {
			expect(json.type).toBe("object")
			expect(json.properties).toBeDefined()
		}
	})

	test("throws when collection has no widgetTypeKeys", () => {
		const emptyCollection = {
			name: "empty",
			widgetTypeKeys: [],
			schemas: {}
		}

		expect(() => createWidgetTypeEnumFromCollection(emptyCollection)).toThrow("collection has no widgetTypeKeys")
	})
})
