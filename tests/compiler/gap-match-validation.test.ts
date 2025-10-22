import { describe, expect, test } from "bun:test"
import { compile } from "@/compiler/compiler"
import type { AssessmentItemInput } from "@/core/item"
import {
	MINIMAL_CORRECT_FEEDBACK,
	MINIMAL_INCORRECT_FEEDBACK
} from "@/testing/helpers/feedback-fixtures"
import { allWidgetsCollection } from "@/widgets/collections/all"

describe("Compiler: gapMatchInteraction validation", () => {
	const baseValidItem: AssessmentItemInput<[]> = {
		identifier: "gap-match-validation-item",
		title: "Gap Match Validation",
		responseDeclarations: [
			{
				identifier: "RESPONSE",
				cardinality: "multiple",
				baseType: "directedPair",
				correct: [{ source: "TOKEN_A", target: "GAP_1" }],
				allowEmpty: false
			}
		],
		body: [{ type: "interactionRef", interactionId: "gap_match" }],
		widgets: null,
		interactions: {
			gap_match: {
				type: "gapMatchInteraction",
				responseIdentifier: "RESPONSE",
				shuffle: true,
				content: [
					{
						type: "paragraph",
						content: [
							{ type: "text", content: "Fill blank: " },
							{ type: "gap", gapId: "GAP_1" }
						]
					}
				],
				gapTexts: [
					{
						identifier: "TOKEN_A",
						matchMax: 1,
						content: [{ type: "text", content: "A" }]
					}
				],
				gaps: [{ identifier: "GAP_1", required: true }]
			}
		},
		feedbackPlan: {
			mode: "combo",
			dimensions: [
				{
					responseIdentifier: "RESPONSE",
					kind: "binary"
				}
			],
			combinations: [
				{
					id: "FB__RESPONSE_CORRECT",
					path: [{ responseIdentifier: "RESPONSE", key: "CORRECT" }]
				},
				{
					id: "FB__RESPONSE_INCORRECT",
					path: [{ responseIdentifier: "RESPONSE", key: "INCORRECT" }]
				}
			]
		},
		feedback: {
			FEEDBACK__OVERALL: {
				RESPONSE: {
					CORRECT: { content: MINIMAL_CORRECT_FEEDBACK },
					INCORRECT: { content: MINIMAL_INCORRECT_FEEDBACK }
				}
			}
		}
	}

	test("should reject gapMatchInteraction when content is null", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.interactions.gap_match.content = null
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject gapMatchInteraction when content is an empty array", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.interactions.gap_match.content = []
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject when gap count in content mismatches gaps array (too few)", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.interactions.gap_match.gaps.push({
			identifier: "GAP_2",
			required: true
		}) // Declared 2, used 1
		invalidItem.responseDeclarations[0].correct.push({
			source: "TOKEN_A",
			target: "GAP_2"
		})
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject when gap count in content mismatches gaps array (too many)", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.interactions.gap_match.content[0].content.push({
			type: "gap",
			gapId: "GAP_1"
		}) // Used 2, declared 1
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject when a gapId in content is not declared in gaps array", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.interactions.gap_match.content[0].content[1].gapId =
			"GAP_UNDECLARED"
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject when a correct.target is not in gaps array", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.responseDeclarations[0].correct[0].target = "GAP_INVALID"
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject when a correct.source is not in gapTexts array", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.responseDeclarations[0].correct[0].source = "TOKEN_INVALID"
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject gap placeholder in top-level body", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.body.unshift({
			type: "paragraph",
			content: [{ type: "gap", gapId: "GAP_1" }]
		})
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject when correct source usage exceeds matchMax", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.interactions.gap_match.gapTexts[0].matchMax = 1
		invalidItem.interactions.gap_match.gaps.push({
			identifier: "GAP_2",
			required: true
		})
		invalidItem.interactions.gap_match.content[0].content.push({
			type: "text",
			content: " and "
		})
		invalidItem.interactions.gap_match.content[0].content.push({
			type: "gap",
			gapId: "GAP_2"
		})
		invalidItem.responseDeclarations[0].correct = [
			{ source: "TOKEN_A", target: "GAP_1" },
			{ source: "TOKEN_A", target: "GAP_2" }
		]
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject duplicate correct pairs", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.responseDeclarations[0].correct = [
			{ source: "TOKEN_A", target: "GAP_1" },
			{ source: "TOKEN_A", target: "GAP_1" }
		]
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should reject ordered cardinality for gapMatch", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.responseDeclarations[0].cardinality = "ordered"
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})

	test("should compile a valid gapMatchInteraction successfully", async () => {
		const xml = await compile(baseValidItem, allWidgetsCollection)
		expect(xml).toContain("<qti-gap-match-interaction")
		expect(xml).toContain(
			'<qti-gap identifier="GAP_1" style="display: inline-block; min-width: 320px; min-height: 120px; border: 2px dashed #ccc; padding: 12px; vertical-align: middle;"/>'
		)
		expect((xml.match(/<qti-gap identifier=/g) || []).length).toBe(1)
		expect(xml).toMatchSnapshot()
	})

	test("should allow matchMax=0 (unlimited) with multiple usages", async () => {
		const validItem = JSON.parse(JSON.stringify(baseValidItem))
		validItem.interactions.gap_match.gapTexts[0].matchMax = 0 // Unlimited
		validItem.interactions.gap_match.gaps.push({
			identifier: "GAP_2",
			required: true
		})
		validItem.interactions.gap_match.content[0].content.push({
			type: "text",
			content: " and "
		})
		validItem.interactions.gap_match.content[0].content.push({
			type: "gap",
			gapId: "GAP_2"
		})
		validItem.responseDeclarations[0].correct = [
			{ source: "TOKEN_A", target: "GAP_1" },
			{ source: "TOKEN_A", target: "GAP_2" }
		]
		const xml = await compile(validItem, allWidgetsCollection)
		expect(xml).toContain("<qti-gap-match-interaction")
		expect((xml.match(/<qti-gap identifier=/g) || []).length).toBe(2)
	})

	test("should reject gap placeholder in feedback blocks", async () => {
		const invalidItem = JSON.parse(JSON.stringify(baseValidItem))
		invalidItem.feedback.FEEDBACK__OVERALL.RESPONSE.CORRECT.content = [
			{
				type: "paragraph",
				content: [{ type: "gap", gapId: "GAP_1" }]
			}
		]
		await expect(compile(invalidItem, allWidgetsCollection)).rejects.toThrow()
	})
})
