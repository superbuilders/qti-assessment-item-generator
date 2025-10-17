import { describe, expect, test } from "bun:test"
import { compile } from "@/compiler/compiler"
import type { AssessmentItemInput } from "@/core/item"
import { allWidgetsCollection } from "@/widgets/collections/all"

describe("Compiler: feedback-as-steps", () => {
	test("should render preamble + steps with correct colors and structure", async () => {
		const item: AssessmentItemInput<[]> = {
			identifier: "feedback-steps-item",
			title: "Feedback Steps Support",
			responseDeclarations: [
				{
					identifier: "RESPONSE",
					cardinality: "single",
					baseType: "identifier",
					correct: "A"
				}
			],
			body: [
				{ type: "paragraph", content: [{ type: "text", content: "What is 2 + 2?" }] },
				{ type: "interactionRef", interactionId: "ci" }
			],
			widgets: null,
			interactions: {
				ci: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE",
					prompt: [{ type: "text", content: "Choose:" }],
					choices: [
						{
							identifier: "A",
							content: [{ type: "paragraph", content: [{ type: "text", content: "4" }] }]
						},
						{
							identifier: "B",
							content: [{ type: "paragraph", content: [{ type: "text", content: "5" }] }]
						}
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			feedbackPlan: {
				mode: "combo",
				dimensions: [{ responseIdentifier: "RESPONSE", kind: "binary" }],
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
						CORRECT: {
							content: {
								preamble: {
									correctness: "correct",
									summary: [{ type: "text", content: "You identified the sum correctly." }]
								},
								steps: [
									{
										type: "step",
										title: [{ type: "text", content: "Understand Addition" }],
										content: [
											{
												type: "paragraph",
												content: [
													{ type: "text", content: "2 + 2 means combining two groups of 2." }
												]
											}
										]
									},
									{
										type: "step",
										title: [{ type: "text", content: "Confirm the Result" }],
										content: [
											{
												type: "paragraph",
												content: [
													{ type: "text", content: "The total is " },
													{ type: "math", mathml: "<mn>4</mn>" },
													{ type: "text", content: "." }
												]
											}
										]
									}
								]
							}
						},
						INCORRECT: {
							content: {
								preamble: {
									correctness: "incorrect",
									summary: [{ type: "text", content: "The sum of 2 + 2 is not 5." }]
								},
								steps: [
									{
										type: "step",
										title: [{ type: "text", content: "Review Addition" }],
										content: [
											{
												type: "paragraph",
												content: [
													{ type: "text", content: "When adding, count all items together." }
												]
											}
										]
									},
									{
										type: "step",
										title: [{ type: "text", content: "Find the Correct Answer" }],
										content: [
											{
												type: "paragraph",
												content: [
													{ type: "text", content: "2 + 2 = " },
													{ type: "math", mathml: "<mn>4</mn>" }
												]
											}
										]
									}
								]
							}
						}
					}
				}
			}
		}
		const xml = await compile(item, allWidgetsCollection)

		// Preamble checks
		expect(xml).toContain("qti-feedback-preamble")
		expect(xml).toContain("Correct! Fantastic work.")
		expect(xml).toContain("You identified the sum correctly")
		expect(xml).toContain("Not quite! Try again.")
		expect(xml).toContain("The sum of 2 + 2 is not 5")

		// Steps checks
		expect(xml).toContain("qti-steps")
		expect(xml).toContain("qti-step")
		expect(xml).toContain("qti-step-index")
		expect(xml).toContain("qti-step-title")
		expect(xml).toContain("Understand Addition")
		expect(xml).toContain("Review Addition")

		// Color palette checks (step 1 blue, step 2 emerald)
		expect(xml).toContain("#2563EB") // blue
		expect(xml).toContain("#059669") // emerald

		expect(xml).toMatchSnapshot()
	})

	test("should enforce minimum 2 steps via schema validation", async () => {
		const itemWithOneStep: AssessmentItemInput<[]> = {
			identifier: "one-step-item",
			title: "One Step",
			responseDeclarations: [
				{
					identifier: "RESPONSE",
					cardinality: "single",
					baseType: "identifier",
					correct: "A"
				}
			],
			body: [
				{ type: "paragraph", content: [{ type: "text", content: "Question" }] },
				{ type: "interactionRef", interactionId: "ci" }
			],
			widgets: null,
			interactions: {
				CI: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE",
					prompt: [],
					choices: [
						{ identifier: "A", content: [] },
						{ identifier: "B", content: [] }
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			feedbackPlan: {
				mode: "fallback",
				dimensions: [{ responseIdentifier: "RESPONSE", kind: "binary" }],
				combinations: [
					{ id: "CORRECT", path: [] },
					{ id: "INCORRECT", path: [] }
				]
			},
			feedback: {
				FEEDBACK__OVERALL: {
					CORRECT: {
						content: {
							preamble: {
								correctness: "correct",
								summary: [{ type: "text", content: "Correct." }]
							},
							steps: [
								{
									type: "step",
									title: [{ type: "text", content: "Only Step" }],
									content: [{ type: "paragraph", content: [{ type: "text", content: "Done." }] }]
								}
							]
						}
					},
					INCORRECT: {
						content: {
							preamble: {
								correctness: "incorrect",
								summary: [{ type: "text", content: "Incorrect." }]
							},
							steps: [
								{
									type: "step",
									title: [{ type: "text", content: "Only Step" }],
									content: [
										{ type: "paragraph", content: [{ type: "text", content: "Try again." }] }
									]
								}
							]
						}
					}
				}
			}
		}

		// Should throw due to schema validation (steps.min(2))
		await expect(compile(itemWithOneStep, allWidgetsCollection)).rejects.toThrow()
	})
})
