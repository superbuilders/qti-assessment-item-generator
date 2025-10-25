// -----------------------------------------------------------------------------
// 1. IMPORTS
// The template only imports what is absolutely necessary: core item types,
// shared seed utilities, and widget typing helpers.
// -----------------------------------------------------------------------------

import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { FeedbackContent } from "@/core/content"
import type { FeedbackPlan } from "@/core/feedback"
import type { AssessmentItemInput } from "@/core/item"
import { createSeededRandom } from "@/templates/seeds"
import type { TemplateModule } from "@/templates/types"

// Define the exact widget tuple used by this template
// The template includes a 'partitionedShape' widget in the widgets map below
export type TemplateWidgets = readonly ["partitionedShape"]

// -----------------------------------------------------------------------------
// 2. FUNDAMENTAL DATA TYPE & TEMPLATE PROPS SCHEMA
// This section defines the public contract of the template. It is the only
// part a user of the template needs to know. Inputs are intentionally opaque
// so the template owns all math-specific authoring decisions.
// -----------------------------------------------------------------------------

/**
 * Defines the structure for a simple fraction.
 */
export type Fraction = { numerator: number; denominator: number }

// -----------------------------------------------------------------------------
// 3. THE TEMPLATE GENERATOR FUNCTION
// This is the deterministic core of the template. It is a pure function that
// transforms the input props into a valid AssessmentItemInput object.
// -----------------------------------------------------------------------------

/**
 * Generates the AssessmentItemInput data structure for a fraction addition question.
 *
 * @param seed - Opaque seed input used to generate the authored question.
 * @returns An AssessmentItemInput object ready for the QTI compiler.
 */
export function generateFractionAdditionQuestion(
	seed: bigint
): AssessmentItemInput<TemplateWidgets> {
	// --- 3a. Self-Contained Mathematical Helpers ---
	// To ensure the template is a pure, dependency-free module, all core
	// mathematical logic is implemented directly within its scope.

	const gcd = (a: number, b: number): number => {
		let x = Math.abs(a)
		let y = Math.abs(b)
		while (y !== 0) {
			const temp = y
			y = x % y
			x = temp
		}
		return x === 0 ? 1 : x
	}

	const simplifyFraction = (frac: Fraction): Fraction => {
		if (frac.denominator === 0) {
			logger.error("fraction denominator zero detected", {
				numerator: frac.numerator,
				denominator: frac.denominator
			})
			throw errors.new("fraction denominator cannot be zero")
		}
		const denominatorSign = frac.denominator < 0 ? -1 : 1
		const normalizedNumerator = frac.numerator * denominatorSign
		const normalizedDenominator = frac.denominator * denominatorSign
		const commonDivisor = gcd(normalizedNumerator, normalizedDenominator)
		return {
			numerator: normalizedNumerator / commonDivisor,
			denominator: normalizedDenominator / commonDivisor
		}
	}

	const addFractions = (f1: Fraction, f2: Fraction): Fraction => {
		const commonDenominator = f1.denominator * f2.denominator
		const newNumerator =
			f1.numerator * f2.denominator + f2.numerator * f1.denominator
		return simplifyFraction({
			numerator: newNumerator,
			denominator: commonDenominator
		})
	}

	const formatFractionMathML = (frac: Fraction): string => {
		return `<mfrac><mn>${frac.numerator}</mn><mn>${frac.denominator}</mn></mfrac>`
	}

	// --- 3b. Core Logic: Determine Fractions From Seed and Build Distractors ---
	const random = createSeededRandom(seed)

	const createFractionFromSeed = (): Fraction => {
		const denominator = random.nextInt(2, 12)
		const maxNumerator = Math.max(1, Math.floor(denominator / 2))
		const numerator = random.nextInt(1, maxNumerator)
		return simplifyFraction({ numerator, denominator })
	}

	const fractionsEqual = (a: Fraction, b: Fraction) =>
		a.numerator === b.numerator && a.denominator === b.denominator

	const f1 = createFractionFromSeed()

	let f2 = createFractionFromSeed()
	if (fractionsEqual(f1, f2)) {
		const alternativeDenominator = f2.denominator === 2 ? 3 : f2.denominator + 1
		const alternativeMaxNumerator = Math.max(
			1,
			Math.floor(alternativeDenominator / 2)
		)
		const alternativeNumerator = Math.min(
			alternativeMaxNumerator,
			f2.numerator + 1
		)
		f2 = simplifyFraction({
			numerator: alternativeNumerator,
			denominator: alternativeDenominator
		})
	}

	const correctAnswer = addFractions(f1, f2)

	// Distractors are generated based on common student misconceptions.
	// Each distractor is tagged with its error type for targeted feedback.
	const distractors: {
		fraction: Fraction
		type:
			| "ADD_ACROSS"
			| "ADD_NUM_KEEP_DEN"
			| "MULTIPLY_DENOMINATORS_ONLY"
			| "FORGOT_TO_SIMPLIFY"
	}[] = [
		{
			// Most common error: Adding numerators and denominators directly
			fraction: simplifyFraction({
				numerator: f1.numerator + f2.numerator,
				denominator: f1.denominator + f2.denominator
			}),
			type: "ADD_ACROSS"
		},
		{
			// Common error: Adding numerators but keeping one denominator
			fraction: simplifyFraction({
				numerator: f1.numerator + f2.numerator,
				denominator: f1.denominator // Uses first denominator
			}),
			type: "ADD_NUM_KEEP_DEN"
		},
		{
			// Error: Multiplying denominators but adding numerators incorrectly
			fraction: simplifyFraction({
				numerator: f1.numerator + f2.numerator, // Should be cross-multiplied
				denominator: f1.denominator * f2.denominator
			}),
			type: "MULTIPLY_DENOMINATORS_ONLY"
		},
		{
			// Show unsimplified correct answer if it's different from simplified
			fraction: {
				numerator:
					f1.numerator * f2.denominator + f2.numerator * f1.denominator,
				denominator: f1.denominator * f2.denominator
			},
			type: "FORGOT_TO_SIMPLIFY"
		}
	]

	// --- 3c. Assemble and Deterministically Sort Choices ---
	const allChoices = [
		{ fraction: correctAnswer, isCorrect: true, type: "CORRECT" as const },
		...distractors.map((d) => ({ ...d, isCorrect: false }))
	]

	// Filter out any distractors that happen to equal the correct answer.
	const uniqueChoices = allChoices.filter(
		(choice, index, self) =>
			index ===
			self.findIndex(
				(c) =>
					c.fraction.numerator === choice.fraction.numerator &&
					c.fraction.denominator === choice.fraction.denominator
			)
	)

	// Ensure exactly 4 choices for a consistent user experience.
	while (uniqueChoices.length < 4) {
		uniqueChoices.push({
			fraction: {
				numerator: uniqueChoices.length + correctAnswer.numerator,
				denominator: correctAnswer.denominator + uniqueChoices.length
			},
			isCorrect: false,
			type: "ADD_ACROSS" // Fallback type
		})
	}

	// Sort choices by their decimal value to ensure a deterministic, non-random order.
	const finalChoices = uniqueChoices
		.slice(0, 4)
		.sort(
			(a, b) =>
				a.fraction.numerator / a.fraction.denominator -
				b.fraction.numerator / b.fraction.denominator
		)

	const correctChoiceIndex = finalChoices.findIndex((c) => c.isCorrect)
	const choiceIdentifiers = finalChoices.map((_, i) => `CHOICE_${i}`)
	const correctChoiceIdentifier =
		correctChoiceIndex >= 0
			? choiceIdentifiers[correctChoiceIndex]
			: choiceIdentifiers[0]

	const feedbackPlan = {
		mode: "combo" as const,
		dimensions: [
			{
				responseIdentifier: "RESPONSE",
				kind: "enumerated",
				keys: choiceIdentifiers
			}
		],
		combinations: choiceIdentifiers.map((choiceId) => ({
			id: `FB__RESPONSE_${choiceId}`,
			path: [{ responseIdentifier: "RESPONSE", key: choiceId }]
		}))
	} satisfies FeedbackPlan

	// --- 3d. Construct the Final AssessmentItemInput Object ---
	// TODO: Update this template to use feedbackPlan + map structure
	const assessmentItem = {
		identifier: `fraction-addition-seed-${seed.toString()}`,
		title: `Fraction Addition: ${f1.numerator}/${f1.denominator} + ${f2.numerator}/${f2.denominator}`,

		body: [
			{
				type: "paragraph",
				content: [
					{
						type: "text",
						content:
							"What is the sum of the fractions below? Give your answer in simplest form."
					}
				]
			},
			{
				type: "paragraph",
				content: [
					{
						type: "math",
						mathml: `${formatFractionMathML(f1)}<mo>+</mo>${formatFractionMathML(f2)}`
					}
				]
			},
			// removed sum_visual slot to avoid missing widget error in compiler-only POC
			{ type: "interactionRef", interactionId: "choice_interaction" }
		],

		widgets: {
			sum_visual: {
				type: "partitionedShape",
				width: 400,
				height: 300,
				mode: "partition",
				layout: "horizontal",
				overlays: [],
				shapes: [
					{
						type: "rectangle",
						totalParts: correctAnswer.denominator,
						shadedCells: Array.from(
							{ length: correctAnswer.numerator },
							(_, i) => i
						),
						hatchedCells: [],
						rows: 1,
						columns: correctAnswer.denominator,
						shadeColor: "#4CAF50B3",
						shadeOpacity: 0.7
					}
				]
			}
		},

		interactions: {
			choice_interaction: {
				type: "choiceInteraction",
				responseIdentifier: "RESPONSE",
				shuffle: true, // Always shuffle choices to ensure fairness.
				minChoices: 1,
				maxChoices: 1,
				prompt: [{ type: "text", content: "Select the correct sum." }],
				choices: finalChoices.map((choice, index) => {
					const choiceId = choiceIdentifiers[index]
					if (choiceId === undefined) {
						logger.error("missing choice identifier during template assembly", {
							index,
							identifierCount: choiceIdentifiers.length
						})
						throw errors.new("missing choice identifier")
					}
					return {
						identifier: choiceId,
						content: [
							{
								type: "paragraph" as const,
								content: [
									{
										type: "math" as const,
										mathml: formatFractionMathML(choice.fraction)
									}
								]
							}
						]
						// REMOVED: The `feedback` field is no longer supported on choices.
					}
				})
			}
		},

		responseDeclarations: [
			{
				identifier: "RESPONSE",
				cardinality: "single",
				baseType: "identifier",
				correct: correctChoiceIdentifier
			}
		],

		feedbackPlan,
		feedback: {
			FEEDBACK__OVERALL: {
				RESPONSE: Object.fromEntries(
					finalChoices.map((choice, index) => {
						const choiceId = choiceIdentifiers[index]
						if (choiceId === undefined) {
							logger.error(
								"missing choice identifier during feedback construction",
								{ index, identifierCount: choiceIdentifiers.length }
							)
							throw errors.new("missing choice identifier for feedback")
						}
						// Helper values for worked example
						const commonDenom = f1.denominator * f2.denominator
						const num1Expanded = Math.abs(f1.numerator) * f2.denominator
						const num2Expanded = Math.abs(f2.numerator) * f1.denominator
						const sumNumerator = num1Expanded + num2Expanded

						let feedbackContent: FeedbackContent<TemplateWidgets>

						switch (choice.type) {
							case "CORRECT":
								feedbackContent = {
									preamble: {
										correctness: "correct",
										summary: [
											{
												type: "text",
												content:
													"You correctly added the fractions and simplified the result."
											}
										]
									},
									steps: [
										{
											type: "step",
											title: [
												{ type: "text", content: "Find Common Denominator" }
											],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "text",
															content: "Multiply the denominators: "
														},
														{
															type: "math",
															mathml: `<mn>${f1.denominator}</mn><mo>×</mo><mn>${f2.denominator}</mn><mo>=</mo><mn>${commonDenom}</mn>`
														}
													]
												}
											]
										},
										{
											type: "step",
											title: [{ type: "text", content: "Convert and Add" }],
											content: [
												{
													type: "paragraph",
													content: [
														{ type: "math", mathml: formatFractionMathML(f1) },
														{ type: "text", content: " = " },
														{
															type: "math",
															mathml: `<mfrac><mn>${num1Expanded}</mn><mn>${commonDenom}</mn></mfrac>`
														},
														{ type: "text", content: " and " },
														{ type: "math", mathml: formatFractionMathML(f2) },
														{ type: "text", content: " = " },
														{
															type: "math",
															mathml: `<mfrac><mn>${num2Expanded}</mn><mn>${commonDenom}</mn></mfrac>`
														}
													]
												},
												{
													type: "paragraph",
													content: [
														{ type: "text", content: "Sum: " },
														{
															type: "math",
															mathml: `<mfrac><mn>${sumNumerator}</mn><mn>${commonDenom}</mn></mfrac>`
														},
														{ type: "text", content: " = " },
														{
															type: "math",
															mathml: formatFractionMathML(correctAnswer)
														}
													]
												}
											]
										}
									]
								}
								break

							case "ADD_ACROSS":
								feedbackContent = {
									preamble: {
										correctness: "incorrect",
										summary: [
											{
												type: "text",
												content:
													"You added the numerators and denominators separately, which changes the fraction value."
											}
										]
									},
									steps: [
										{
											type: "step",
											title: [{ type: "text", content: "Why This Is Wrong" }],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "text",
															content:
																'Fractions represent parts of a whole. When you add denominators, you change what "whole" means.'
														}
													]
												}
											]
										},
										{
											type: "step",
											title: [{ type: "text", content: "Correct Approach" }],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "text",
															content: "Find common denominator: "
														},
														{
															type: "math",
															mathml: `<mn>${f1.denominator}</mn><mo>×</mo><mn>${f2.denominator}</mn><mo>=</mo><mn>${commonDenom}</mn>`
														}
													]
												},
												{
													type: "paragraph",
													content: [
														{ type: "text", content: "Convert and add: " },
														{
															type: "math",
															mathml: `<mfrac><mn>${num1Expanded}</mn><mn>${commonDenom}</mn></mfrac><mo>+</mo><mfrac><mn>${num2Expanded}</mn><mn>${commonDenom}</mn></mfrac><mo>=</mo><mfrac><mn>${sumNumerator}</mn><mn>${commonDenom}</mn></mfrac>`
														}
													]
												}
											]
										}
									]
								}
								break

							case "ADD_NUM_KEEP_DEN":
								feedbackContent = {
									preamble: {
										correctness: "incorrect",
										summary: [
											{
												type: "text",
												content:
													"You added the numerators but kept one denominator without converting both fractions."
											}
										]
									},
									steps: [
										{
											type: "step",
											title: [
												{ type: "text", content: "Identify the Mistake" }
											],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "text",
															content:
																"You can only add numerators directly when denominators are already the same."
														}
													]
												}
											]
										},
										{
											type: "step",
											title: [
												{ type: "text", content: "Apply Correct Method" }
											],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "text",
															content: "Convert both to common denominator "
														},
														{ type: "math", mathml: `<mn>${commonDenom}</mn>` },
														{ type: "text", content: ", then add: " },
														{
															type: "math",
															mathml: `<mfrac><mn>${num1Expanded}</mn><mn>${commonDenom}</mn></mfrac><mo>+</mo><mfrac><mn>${num2Expanded}</mn><mn>${commonDenom}</mn></mfrac><mo>=</mo><mfrac><mn>${sumNumerator}</mn><mn>${commonDenom}</mn></mfrac>`
														}
													]
												}
											]
										}
									]
								}
								break

							case "MULTIPLY_DENOMINATORS_ONLY":
								feedbackContent = {
									preamble: {
										correctness: "incorrect",
										summary: [
											{
												type: "text",
												content:
													"You found the common denominator but didn't adjust the numerators proportionally."
											}
										]
									},
									steps: [
										{
											type: "step",
											title: [
												{
													type: "text",
													content: "Understanding Equivalent Fractions"
												}
											],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "text",
															content:
																"When changing denominator, multiply numerator by the same factor: "
														},
														{
															type: "math",
															mathml:
																"<mfrac><mi>a</mi><mi>b</mi></mfrac><mo>=</mo><mfrac><mrow><mi>a</mi><mo>×</mo><mi>k</mi></mrow><mrow><mi>b</mi><mo>×</mo><mi>k</mi></mrow></mfrac>"
														}
													]
												}
											]
										},
										{
											type: "step",
											title: [
												{ type: "text", content: "Complete the Calculation" }
											],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "math",
															mathml: `<mfrac><mn>${num1Expanded}</mn><mn>${commonDenom}</mn></mfrac><mo>+</mo><mfrac><mn>${num2Expanded}</mn><mn>${commonDenom}</mn></mfrac><mo>=</mo><mfrac><mn>${sumNumerator}</mn><mn>${commonDenom}</mn></mfrac>`
														},
														{ type: "text", content: " = " },
														{
															type: "math",
															mathml: formatFractionMathML(correctAnswer)
														}
													]
												}
											]
										}
									]
								}
								break

							case "FORGOT_TO_SIMPLIFY":
								feedbackContent = {
									preamble: {
										correctness: "incorrect",
										summary: [
											{
												type: "text",
												content:
													"You found the right sum but forgot to simplify it to lowest terms."
											}
										]
									},
									steps: [
										{
											type: "step",
											title: [{ type: "text", content: "Check Your Work" }],
											content: [
												{
													type: "paragraph",
													content: [
														{ type: "text", content: "Your answer " },
														{
															type: "math",
															mathml: formatFractionMathML(choice.fraction)
														},
														{ type: "text", content: " equals " },
														{
															type: "math",
															mathml: formatFractionMathML(correctAnswer)
														},
														{ type: "text", content: " when simplified." }
													]
												}
											]
										},
										{
											type: "step",
											title: [{ type: "text", content: "Simplification Rule" }],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "text",
															content: `Divide numerator and denominator by GCD(${sumNumerator}, ${commonDenom}) = ${gcd(sumNumerator, commonDenom)}.`
														}
													]
												}
											]
										}
									]
								}
								break

							default:
								feedbackContent = {
									preamble: {
										correctness: "incorrect",
										summary: [
											{ type: "text", content: "Your answer is incorrect." }
										]
									},
									steps: [
										{
											type: "step",
											title: [{ type: "text", content: "Review the Method" }],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "text",
															content: "Find common denominator: "
														},
														{ type: "math", mathml: `<mn>${commonDenom}</mn>` }
													]
												}
											]
										},
										{
											type: "step",
											title: [{ type: "text", content: "Complete Solution" }],
											content: [
												{
													type: "paragraph",
													content: [
														{
															type: "math",
															mathml: `<mfrac><mn>${num1Expanded}</mn><mn>${commonDenom}</mn></mfrac><mo>+</mo><mfrac><mn>${num2Expanded}</mn><mn>${commonDenom}</mn></mfrac><mo>=</mo><mfrac><mn>${sumNumerator}</mn><mn>${commonDenom}</mn></mfrac>`
														},
														{ type: "text", content: " = " },
														{
															type: "math",
															mathml: formatFractionMathML(correctAnswer)
														}
													]
												}
											]
										}
									]
								}
						}

						return [choiceId, { content: feedbackContent }] as const
					})
				)
			}
		}
	} satisfies AssessmentItemInput<TemplateWidgets, typeof feedbackPlan>

	return assessmentItem
}

// -----------------------------------------------------------------------------
// 4. CANONICAL TEMPLATE EXPORT
// Provides a consistent interface for dynamic loading systems.
// -----------------------------------------------------------------------------

export const templateId = "math.fraction-addition"
export const version = "1.0.0"

const templateModule: TemplateModule<TemplateWidgets> = {
	templateId,
	version,
	generate: generateFractionAdditionQuestion
}

export default templateModule
