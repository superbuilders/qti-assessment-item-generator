import { describe, expect, test } from "bun:test"
import { compileResponseProcessing } from "@/compiler/response-processor"

type ResponseProcessingInput = Parameters<typeof compileResponseProcessing>[0]

function createBaseItem(
	overrides: Partial<ResponseProcessingInput>
): ResponseProcessingInput {
	return {
		identifier: "ITEM",
		title: "Numeric Response Item",
		body: null,
		widgets: null,
		interactions: null,
		responseDeclarations: [],
		feedbackPlan: {
			mode: "fallback",
			dimensions: [],
			combinations: []
		},
		feedbackBlocks: {},
		...overrides
	}
}

describe("compileResponseProcessing / numerics", () => {
	test("uses <qti-equal-rounded> for float responses in fallback mode", () => {
		const item = createBaseItem({
			responseDeclarations: [
				{
					identifier: "RESPONSE_FLOAT",
					cardinality: "single",
					baseType: "float",
					correct: 3.14,
					rounding: {
						strategy: "decimalPlaces",
						figures: 2
					}
				}
			],
			feedbackPlan: {
				mode: "fallback",
				dimensions: [{ responseIdentifier: "RESPONSE_FLOAT", kind: "binary" }],
				combinations: [
					{
						id: "CORRECT",
						path: [{ responseIdentifier: "RESPONSE_FLOAT", key: "CORRECT" }]
					},
					{
						id: "INCORRECT",
						path: [{ responseIdentifier: "RESPONSE_FLOAT", key: "INCORRECT" }]
					}
				]
			}
		})

		const xml = compileResponseProcessing(item)

		expect(xml).toContain(
			'<qti-equal-rounded rounding-mode="decimalPlaces" figures="2">'
		)
		expect(xml).not.toContain(
			`<qti-match><qti-variable identifier="RESPONSE_FLOAT"/><qti-correct identifier="RESPONSE_FLOAT"/></qti-match>`
		)
	})

	test("falls back to <qti-match> for string responses", () => {
		const item = createBaseItem({
			responseDeclarations: [
				{
					identifier: "RESPONSE_TEXT",
					cardinality: "single",
					baseType: "string",
					correct: "forty-two"
				}
			],
			feedbackPlan: {
				mode: "fallback",
				dimensions: [{ responseIdentifier: "RESPONSE_TEXT", kind: "binary" }],
				combinations: [
					{
						id: "CORRECT",
						path: [{ responseIdentifier: "RESPONSE_TEXT", key: "CORRECT" }]
					},
					{
						id: "INCORRECT",
						path: [{ responseIdentifier: "RESPONSE_TEXT", key: "INCORRECT" }]
					}
				]
			}
		})

		const xml = compileResponseProcessing(item)

		expect(xml).toContain(
			`<qti-match><qti-variable identifier="RESPONSE_TEXT"/><qti-correct identifier="RESPONSE_TEXT"/></qti-match>`
		)
	})

	test("keeps enumerated combo conditions using <qti-match> while scoring numerics with <qti-equal-rounded>", () => {
		const item = createBaseItem({
			responseDeclarations: [
				{
					identifier: "RESPONSE_CHOICE",
					cardinality: "single",
					baseType: "identifier",
					correct: "A"
				},
				{
					identifier: "RESPONSE_FLOAT",
					cardinality: "single",
					baseType: "float",
					correct: 12.5,
					rounding: {
						strategy: "decimalPlaces",
						figures: 1
					}
				}
			],
			feedbackPlan: {
				mode: "combo",
				dimensions: [
					{
						responseIdentifier: "RESPONSE_CHOICE",
						kind: "enumerated",
						keys: ["A", "B"]
					},
					{
						responseIdentifier: "RESPONSE_FLOAT",
						kind: "binary"
					}
				],
				combinations: [
					{
						id: "COMBO__CHOICE_A_FLOAT_CORRECT",
						path: [
							{ responseIdentifier: "RESPONSE_CHOICE", key: "A" },
							{ responseIdentifier: "RESPONSE_FLOAT", key: "CORRECT" }
						]
					},
					{
						id: "COMBO__CHOICE_A_FLOAT_INCORRECT",
						path: [
							{ responseIdentifier: "RESPONSE_CHOICE", key: "A" },
							{ responseIdentifier: "RESPONSE_FLOAT", key: "INCORRECT" }
						]
					},
					{
						id: "COMBO__CHOICE_B_FLOAT_CORRECT",
						path: [
							{ responseIdentifier: "RESPONSE_CHOICE", key: "B" },
							{ responseIdentifier: "RESPONSE_FLOAT", key: "CORRECT" }
						]
					},
					{
						id: "COMBO__CHOICE_B_FLOAT_INCORRECT",
						path: [
							{ responseIdentifier: "RESPONSE_CHOICE", key: "B" },
							{ responseIdentifier: "RESPONSE_FLOAT", key: "INCORRECT" }
						]
					}
				]
			}
		})

		const xml = compileResponseProcessing(item)

		expect(xml).toContain(
			`<qti-match>
                <qti-variable identifier="RESPONSE_CHOICE"/>
                <qti-base-value base-type="identifier">A</qti-base-value>
            </qti-match>`
		)
		expect(xml).toContain(
			'<qti-equal-rounded rounding-mode="decimalPlaces" figures="1">'
		)
	})
})
