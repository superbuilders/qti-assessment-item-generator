#!/usr/bin/env bun

import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import OpenAI from "openai"
import { compile } from "@/compiler/compiler"
import type { AssessmentItemInput } from "@/core/item"
import { differentiateAssessmentItem } from "@/structured/differentiator"
import { allWidgetsCollection } from "@/widgets/collections/all"

// Test input - plant and pot combinations
const sourceItem: AssessmentItemInput<["boxPlot"]> = {
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content: "Before sending track and field athletes to the Olympics, the U.S. holds a qualifying meet."
				}
			]
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content: "The box plots below show the distances (in meters) achieved in the final round by the top "
				},
				{ type: "math", mathml: "<mn>11</mn>" },
				{ type: "text", content: " women's discus throwers at the " },
				{ type: "math", mathml: "<mn>2012</mn>" },
				{ type: "text", content: " Olympic Games and the top " },
				{ type: "math", mathml: "<mn>12</mn>" },
				{ type: "text", content: " women's discus throwers at the U.S. qualifying meet." }
			]
		},
		{ type: "widgetRef", widgetId: "image_1", widgetType: "boxPlot" },
		{ type: "paragraph", content: [{ type: "text", content: "Which conclusion is supported by these box plots?" }] },
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	title: "Interpret box plots for discus throw distances",
	widgets: {
		image_1: {
			axis: { max: 69, min: 54, label: "Distance, in meters", tickLabels: [54, 56, 58, 60, 62, 64, 66, 68, 69] },
			type: "boxPlot",
			width: 480,
			height: 320,
			summary: { q1: 54.5, q3: 60, max: 63, min: 54, median: 58 },
			boxColor: "#E8F4FD",
			medianColor: "#FF6B6B"
		}
	},
	feedbackPlan: {
		mode: "fallback",
		dimensions: [],
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
						summary: [
							{
								type: "text",
								content:
									"The center of the Olympic final distribution is higher than the center of the U.S. qualifier distribution."
							}
						]
					},
					steps: [
						{
							type: "step",
							title: [{ type: "text", content: "Compare Centers" }],
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", content: "The Olympic final center is higher on the dot plot scale." }]
								}
							]
						},
						{
							type: "step",
							title: [{ type: "text", content: "Conclusion" }],
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", content: "The Olympic final distances were greater on average." }]
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
						summary: [
							{
								type: "text",
								content: "The distributions overlap, so not all Olympic final distances are greater."
							}
						]
					},
					steps: [
						{
							type: "step",
							title: [{ type: "text", content: "Check Overlap" }],
							content: [
								{
									type: "paragraph",
									content: [
										{
											type: "text",
											content:
												"The distributions overlap, indicating some U.S. qualifier distances exceed Olympic ones."
										}
									]
								}
							]
						},
						{
							type: "step",
							title: [{ type: "text", content: "Compare Spread" }],
							content: [
								{
									type: "paragraph",
									content: [
										{
											type: "text",
											content:
												"The spreads appear similar, and the U.S. qualifier box has a larger interquartile range."
										}
									]
								}
							]
						}
					]
				}
			}
		}
	},
	identifier: "olympic-discus-boxplots-interpretation",
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			prompt: [{ type: "text", content: "Which conclusion is supported by these box plots? Select one answer." }],
			choices: [
				{
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", content: "The distances in the Olympic final were farther on average." }]
						}
					],
					identifier: "A"
				},
				{
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "text",
									content:
										"The distances in the Olympic final were all greater than the distances in the U.S. qualifier."
								}
							]
						}
					],
					identifier: "B"
				},
				{
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "text",
									content:
										"The distances in the Olympic final varied noticeably more than the distances in the U.S. qualifier."
								}
							]
						}
					],
					identifier: "C"
				},
				{
					content: [{ type: "paragraph", content: [{ type: "text", content: "None of the above." }] }],
					identifier: "D"
				}
			],
			shuffle: true,
			maxChoices: 1,
			minChoices: 1,
			responseIdentifier: "choice_interaction"
		}
	},
	responseDeclarations: [
		{ correct: "A", baseType: "identifier", identifier: "choice_interaction", cardinality: "single" }
	]
}

async function main() {
	logger.info("starting differentiation test")
	logger.info("separator", { line: "=".repeat(80) })

	// Check for API key
	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey) {
		logger.error("openai api key not set")
		process.exit(1)
	}

	// Initialize OpenAI client
	const openai = new OpenAI({ apiKey })

	// Number of variations to generate
	const numVariations = 3

	logger.info("processing original item", { title: sourceItem.title })
	logger.info("generating variations", { count: numVariations })

	// Run differentiation
	const result = await errors.try(
		differentiateAssessmentItem(openai, logger, sourceItem, numVariations, allWidgetsCollection)
	)

	if (result.error) {
		logger.error("differentiation failed", { error: result.error })
		process.exit(1)
	}

	const differentiatedItems = result.data
	logger.info("successfully generated variations", { count: differentiatedItems.length })

	// Display each variation
	for (let i = 0; i < differentiatedItems.length; i++) {
		const item = differentiatedItems[i]
		logger.info("variation details", {
			variation: i + 1,
			identifier: item.identifier,
			title: item.title
		})

		// Extract some key content to show the variation
		if (item.body && item.body[0]?.type === "paragraph") {
			const firstPara = item.body[0].content[0]
			if (firstPara?.type === "text") {
				logger.info("variation opening", {
					variation: i + 1,
					opening: `${firstPara.content.substring(0, 80)}...`
				})
			}
		}

		// Show widget info
		if (item.widgets) {
			const widgetKeys = Object.keys(item.widgets)
			logger.info("variation widgets", {
				variation: i + 1,
				widgetCount: widgetKeys.length,
				widgetKeys: widgetKeys
			})
		}

		// Show interaction info
		if (item.interactions) {
			const interactionKeys = Object.keys(item.interactions)
			logger.info("variation interactions", {
				variation: i + 1,
				interactionCount: interactionKeys.length,
				interactionKeys: interactionKeys
			})
		}
	}

	// Optionally compile one variation to XML
	logger.info("compiling first variation to qti xml")
	const xmlResult = await errors.try(compile(differentiatedItems[0], allWidgetsCollection))

	if (xmlResult.error) {
		logger.error("compilation failed", { error: xmlResult.error })
	} else {
		logger.info("xml compilation successful")
		logger.info("xml preview", {
			preview: `${xmlResult.data.substring(0, 500)}...`,
			separator: "-".repeat(80)
		})
	}

	// Save outputs to files
	logger.info("saving outputs")

	// Save differentiated items as JSON
	const outputDir = "./test-output"
	await Bun.write(`${outputDir}/differentiated-items.json`, JSON.stringify(differentiatedItems, null, 2))
	logger.info("saved differentiated items", { path: `${outputDir}/differentiated-items.json` })

	// Save first XML
	if (xmlResult.data) {
		await Bun.write(`${outputDir}/variation-1.xml`, xmlResult.data)
		logger.info("saved xml", { path: `${outputDir}/variation-1.xml` })
	}

	logger.info("test complete")
}

// Run the test
main().catch((error) => {
	logger.error("unexpected error", { error })
	process.exit(1)
})
