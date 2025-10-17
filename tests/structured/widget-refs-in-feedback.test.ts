import { describe, expect, test } from "bun:test"
import type { BlockContent } from "@/core/content"
import type { AuthoringFeedbackOverall } from "@/core/feedback/authoring/types"
import type { FeedbackPlan } from "@/core/feedback/plan"
import { collectWidgetRefs } from "@/structured/utils/collector"

describe("Widget Ref Collection: Feedback Traversal", () => {
	const W = ["numberLine", "coordinatePlane"] as const

	test("should collect widget refs from fallback feedback (CORRECT/INCORRECT)", () => {
		const feedback: { FEEDBACK__OVERALL: AuthoringFeedbackOverall<FeedbackPlan, typeof W> } = {
			FEEDBACK__OVERALL: {
				CORRECT: {
					content: {
						preamble: {
							correctness: "correct",
							summary: [
								{ type: "text", content: "Good job! " },
								{
									type: "inlineWidgetRef",
									widgetId: "widget_inline_correct",
									widgetType: "numberLine"
								}
							]
						},
						steps: [
							{
								type: "step",
								title: [{ type: "text", content: "Review" }],
								content: [
									{
										type: "widgetRef",
										widgetId: "widget_block_correct",
										widgetType: "coordinatePlane"
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
							summary: [{ type: "text", content: "Try again." }]
						},
						steps: [
							{
								type: "step",
								title: [{ type: "text", content: "Check Diagram" }],
								content: [
									{
										type: "widgetRef",
										widgetId: "widget_block_incorrect",
										widgetType: "numberLine"
									}
								]
							}
						]
					}
				}
			}
		}

		const refs = collectWidgetRefs({
			body: null,
			feedback,
			interactions: null
		})

		expect(refs.size).toBe(3)
		expect(refs.get("widget_inline_correct")).toBe("numberLine")
		expect(refs.get("widget_block_correct")).toBe("coordinatePlane")
		expect(refs.get("widget_block_incorrect")).toBe("numberLine")
	})

	test("should collect widget refs from nested combo feedback", () => {
		const feedback: { FEEDBACK__OVERALL: AuthoringFeedbackOverall<FeedbackPlan, typeof W> } = {
			FEEDBACK__OVERALL: {
				RESPONSE_1: {
					CORRECT: {
						RESPONSE_2: {
							A: {
								content: {
									preamble: {
										correctness: "correct",
										summary: [{ type: "text", content: "Correct." }]
									},
									steps: [
										{
											type: "step",
											title: [{ type: "text", content: "Step" }],
											content: [
												{ type: "widgetRef", widgetId: "widget_r1c_r2a", widgetType: "numberLine" }
											]
										}
									]
								}
							},
							B: {
								content: {
									preamble: {
										correctness: "correct",
										summary: [{ type: "text", content: "Correct." }]
									},
									steps: [
										{
											type: "step",
											title: [{ type: "text", content: "Step" }],
											content: [
												{
													type: "widgetRef",
													widgetId: "widget_r1c_r2b",
													widgetType: "coordinatePlane"
												}
											]
										}
									]
								}
							}
						}
					},
					INCORRECT: {
						RESPONSE_2: {
							A: {
								content: {
									preamble: {
										correctness: "incorrect",
										summary: [
											{
												type: "inlineWidgetRef",
												widgetId: "widget_r1i_r2a",
												widgetType: "numberLine"
											}
										]
									},
									steps: [
										{
											type: "step",
											title: [{ type: "text", content: "Step 1" }],
											content: [
												{ type: "paragraph", content: [{ type: "text", content: "Review." }] }
											]
										}
									]
								}
							},
							B: {
								content: {
									preamble: {
										correctness: "incorrect",
										summary: [{ type: "text", content: "Try again." }]
									},
									steps: [
										{
											type: "step",
											title: [{ type: "text", content: "Step 1" }],
											content: [
												{ type: "paragraph", content: [{ type: "text", content: "Review." }] }
											]
										}
									]
								}
							}
						}
					}
				}
			}
		}

		const refs = collectWidgetRefs({
			body: null,
			feedback,
			interactions: null
		})

		expect(refs.size).toBe(3)
		expect(refs.get("widget_r1c_r2a")).toBe("numberLine")
		expect(refs.get("widget_r1c_r2b")).toBe("coordinatePlane")
		expect(refs.get("widget_r1i_r2a")).toBe("numberLine")
	})

	test("should collect widget refs from both body and feedback", () => {
		const body: BlockContent<typeof W> = [
			{ type: "widgetRef", widgetId: "body_widget", widgetType: "numberLine" }
		]

		const feedback: { FEEDBACK__OVERALL: AuthoringFeedbackOverall<FeedbackPlan, typeof W> } = {
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
								title: [{ type: "text", content: "Diagram" }],
								content: [
									{ type: "widgetRef", widgetId: "feedback_widget", widgetType: "coordinatePlane" }
								]
							}
						]
					}
				},
				INCORRECT: {
					content: {
						preamble: {
							correctness: "incorrect",
							summary: [{ type: "text", content: "Try again." }]
						},
						steps: [
							{
								type: "step",
								title: [{ type: "text", content: "Step 1" }],
								content: [{ type: "paragraph", content: [{ type: "text", content: "Review." }] }]
							}
						]
					}
				}
			}
		}

		const refs = collectWidgetRefs({
			body,
			feedback,
			interactions: null
		})

		expect(refs.size).toBe(2)
		expect(refs.get("body_widget")).toBe("numberLine")
		expect(refs.get("feedback_widget")).toBe("coordinatePlane")
	})
})
