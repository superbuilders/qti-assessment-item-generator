import type { FeedbackContent } from "@/core/content"
import type { FeedbackPlan } from "@/core/feedback"
import type { AssessmentItemInput } from "@/core/item"
import { createSeededRandom } from "@/templates/seeds"

export type TemplateWidgets = readonly []

type ChoiceId = "A" | "B" | "C" | "D"

const toWords0to19 = (n: number): string => {
	switch (n) {
		case 0:
			return "zero"
		case 1:
			return "one"
		case 2:
			return "two"
		case 3:
			return "three"
		case 4:
			return "four"
		case 5:
			return "five"
		case 6:
			return "six"
		case 7:
			return "seven"
		case 8:
			return "eight"
		case 9:
			return "nine"
		case 10:
			return "ten"
		case 11:
			return "eleven"
		case 12:
			return "twelve"
		case 13:
			return "thirteen"
		case 14:
			return "fourteen"
		case 15:
			return "fifteen"
		case 16:
			return "sixteen"
		case 17:
			return "seventeen"
		case 18:
			return "eighteen"
		case 19:
			return "nineteen"
		default:
			return ""
	}
}

const tensWord = (t: number): string => {
	switch (t) {
		case 2:
			return "twenty"
		case 3:
			return "thirty"
		case 4:
			return "forty"
		case 5:
			return "fifty"
		case 6:
			return "sixty"
		case 7:
			return "seventy"
		case 8:
			return "eighty"
		case 9:
			return "ninety"
		default:
			return ""
	}
}

const twoDigitWords = (n: number, useHyphen: boolean): string => {
	if (n < 20) return toWords0to19(n)
	const t = Math.floor(n / 10)
	const o = n % 10
	const base = tensWord(t)
	if (o === 0) return base
	const joiner = useHyphen ? "-" : " "
	return `${base}${joiner}${toWords0to19(o)}`
}

const numberBelow1000ToWords = (n: number, useHyphen: boolean): string => {
	const h = Math.floor(n / 100)
	const rest = n % 100
	const parts: string[] = []
	if (h > 0) {
		parts.push(`${toWords0to19(h)} hundred`)
	}
	if (rest > 0) {
		if (rest < 20) parts.push(toWords0to19(rest))
		else parts.push(twoDigitWords(rest, useHyphen))
	}
	return parts.join(" ").trim()
}

const wholeNumberToWords = (n: number, useHyphen: boolean): string => {
	const thousands = Math.floor(n / 1000)
	const rest = n % 1000
	const parts: string[] = []
	if (thousands > 0) {
		parts.push(`${toWords0to19(thousands)} thousand`)
	}
	if (rest > 0) {
		parts.push(numberBelow1000ToWords(rest, useHyphen))
	}
	return parts.join(" ").trim()
}

const unitName = (places: number, count: number): string => {
	if (places === 1) return count === 1 ? "tenth" : "tenths"
	return count === 1 ? "hundredth" : "hundredths"
}

const swappedUnitName = (places: number, count: number): string =>
	unitName(places === 1 ? 2 : 1, count)

const decimalWords = (
	value: number,
	places: number,
	useHyphen: boolean
): string => {
	const words =
		value < 20 ? toWords0to19(value) : twoDigitWords(value, useHyphen)
	return `${words} ${unitName(places, value)}`
}

const decimalWordsWrongUnit = (
	value: number,
	places: number,
	useHyphen: boolean
): string => {
	const words =
		value < 20 ? toWords0to19(value) : twoDigitWords(value, useHyphen)
	return `${words} ${swappedUnitName(places, value)}`
}

const withCommas = (n: number): string =>
	n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

const mathmn = (s: string | number): string => `<mn>${s}</mn>`

const fractionML = (num: number, den: number): string =>
	`<mfrac><mn>${num}</mn><mn>${den}</mn></mfrac>`

const decimalML = (digitsAfterDecimal: string): string =>
	`<mn>0.${digitsAfterDecimal}</mn>`

export default function generateTemplate(
	seed: bigint
): AssessmentItemInput<TemplateWidgets> {
	const random = createSeededRandom(seed)

	// Whole number components
	const thousands = random.nextInt(1, 3) // 1..3
	const hundreds = random.nextInt(2, 9) // 2..9 to avoid compression edge cases
	const tens = random.nextInt(2, 9) // 2..9 to avoid teens in tens place
	const ones = 0

	// Decimal configuration: tenths or hundredths
	const places = random.nextBoolean() ? 1 : 2
	const decimalMin = places === 1 ? 1 : 10
	const decimalMax = places === 1 ? 9 : 99
	const decimalValue = random.nextInt(decimalMin, decimalMax)

	// Hyphenation style for compound numbers
	const useHyphen = random.nextBoolean()

	// Construct numeric values
	const wholeNumber = thousands * 1000 + hundreds * 100 + tens * 10 + ones
	const denom = places === 1 ? 10 : 100
	const decimalDigits =
		places === 1 ? `${decimalValue}` : decimalValue.toString().padStart(2, "0")

	// Expanded form MathML
	const expandedMathML =
		`${mathmn(withCommas(thousands * 1000))}` +
		`<mo>+</mo>${mathmn(hundreds * 100)}` +
		`<mo>+</mo>${mathmn(tens * 10)}` +
		`<mo>+</mo>${decimalML(decimalDigits)}`

	// Word forms
	const wholeWordsCorrect = wholeNumberToWords(wholeNumber, useHyphen)
	const decimalCorrect = decimalWords(decimalValue, places, useHyphen)
	const correctWords = `${wholeWordsCorrect} and ${decimalCorrect}`

	// Distractor: tens interpreted as ones (drops the factor of 10 on the tens addend)
	const wholeWordsTensAsOnes = wholeNumberToWords(
		thousands * 1000 + hundreds * 100 + tens,
		useHyphen
	)
	const tensAsOnesWords = `${wholeWordsTensAsOnes} and ${decimalCorrect}`

	// Distractor: correct whole, wrong decimal unit (swap tenths/hundredths)
	const wrongUnitWords = `${wholeWordsCorrect} and ${decimalWordsWrongUnit(
		decimalValue,
		places,
		useHyphen
	)}`

	// Distractor: compress hundreds into tens and use wrong decimal unit
	const compressedWholeValue = thousands * 1000 + hundreds * 10 + tens
	const compressedWholeWords = wholeNumberToWords(
		compressedWholeValue,
		useHyphen
	)
	const compressedAndWrongUnitWords = `${compressedWholeWords} and ${decimalWordsWrongUnit(
		decimalValue,
		places,
		useHyphen
	)}`

	// Prompts driven by seed
	const leadVariants = [
		"Here is a number written in expanded form.",
		"A number is expressed as a sum of place values.",
		"Below is the expanded form of a number."
	]
	const questionVariants = [
		"Which option states this number in words?",
		"Choose the matching wording.",
		"What is its word form?",
		"Select the matching word form."
	]
	const lead = leadVariants[random.nextInt(0, leadVariants.length - 1)]
	const question =
		questionVariants[random.nextInt(0, questionVariants.length - 1)]

	// Choices
	const assessmentChoices: Array<{ identifier: ChoiceId; label: string }> = [
		{ identifier: "A", label: correctWords },
		{ identifier: "B", label: tensAsOnesWords },
		{ identifier: "C", label: compressedAndWrongUnitWords },
		{ identifier: "D", label: wrongUnitWords }
	]

	// Feedback plan (keys must be mutable string[] to satisfy type)
	const responseKeys: string[] = ["A", "B", "C", "D"]
	const feedbackPlan = {
		mode: "combo",
		dimensions: [
			{
				responseIdentifier: "RESPONSE",
				kind: "enumerated",
				keys: responseKeys
			}
		],
		combinations: responseKeys.map((id) => ({
			id: `FB__RESPONSE_${id}`,
			path: [{ responseIdentifier: "RESPONSE", key: id }]
		}))
	} satisfies FeedbackPlan

	// Helper values for feedback
	const decimalAsFractionML = fractionML(decimalValue, denom)
	const decimalPointDigitsText = `${places} digit${places === 1 ? "" : "s"}`

	// Feedback builders
	const buildCorrectFeedback = (): FeedbackContent<TemplateWidgets> => ({
		preamble: {
			correctness: "correct",
			summary: [
				{
					type: "text",
					content:
						"Your wording matches each expanded part and the decimal place value."
				}
			]
		},
		steps: [
			{
				type: "step",
				title: [{ type: "text", content: "Identify each addend" }],
				content: [
					{
						type: "paragraph",
						content: [
							{ type: "text", content: "Expanded form: " },
							{ type: "math", mathml: expandedMathML }
						]
					},
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								content:
									"These addends represent thousands, hundreds, tens, and a decimal part."
							}
						]
					}
				]
			},
			{
				type: "step",
				title: [{ type: "text", content: "Read the decimal part" }],
				content: [
					{
						type: "paragraph",
						content: [
							{ type: "text", content: "The decimal " },
							{ type: "math", mathml: decimalML(decimalDigits) },
							{ type: "text", content: " equals " },
							{ type: "math", mathml: decimalAsFractionML },
							{
								type: "text",
								content: `, and it has ${decimalPointDigitsText} after the decimal point, so use “${unitName(
									places,
									decimalValue
								)}”.`
							}
						]
					}
				]
			},
			{
				type: "step",
				title: [{ type: "text", content: "Combine parts into words" }],
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								content: `Say the whole number (${wholeWordsCorrect}), then say “and,” then the decimal as “${decimalCorrect}.”`
							}
						]
					}
				]
			}
		]
	})

	const buildTensAsOnesFeedback = (): FeedbackContent<TemplateWidgets> => ({
		preamble: {
			correctness: "incorrect",
			summary: [
				{ type: "text", content: "The tens addend is " },
				{ type: "math", mathml: mathmn(tens * 10) },
				{ type: "text", content: " but your choice treated it as " },
				{ type: "math", mathml: mathmn(tens) },
				{
					type: "text",
					content:
						". The decimal portion was named with the correct place value."
				}
			]
		},
		steps: [
			{
				type: "step",
				title: [{ type: "text", content: "Match tens correctly" }],
				content: [
					{
						type: "paragraph",
						content: [
							{ type: "text", content: "Expanded form includes " },
							{ type: "math", mathml: mathmn(tens * 10) },
							{
								type: "text",
								content: `, so the wording needs the tens phrase (“${twoDigitWords(
									tens * 10,
									useHyphen
								)}”), not the ones phrase (“${toWords0to19(tens)}”).`
							}
						]
					}
				]
			},
			{
				type: "step",
				title: [{ type: "text", content: "Assemble the full phrase" }],
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								content: `Whole number: ${wholeWordsCorrect}. Decimal: “${decimalCorrect}.” Combine with “and.”`
							}
						]
					}
				]
			}
		]
	})

	const buildWrongUnitOnlyFeedback = (): FeedbackContent<TemplateWidgets> => ({
		preamble: {
			correctness: "incorrect",
			summary: [
				{
					type: "text",
					content:
						"The decimal was named with the wrong place value for the given digits."
				},
				{ type: "text", content: " Note that " },
				{ type: "math", mathml: decimalML(decimalDigits) },
				{ type: "text", content: " equals " },
				{ type: "math", mathml: decimalAsFractionML },
				{
					type: "text",
					content: `, which should be read in ${unitName(places, decimalValue)}.`
				}
			]
		},
		steps: [
			{
				type: "step",
				title: [{ type: "text", content: "Determine tenths vs. hundredths" }],
				content: [
					{
						type: "paragraph",
						content: [
							{ type: "text", content: "There are " },
							{ type: "math", mathml: mathmn(places) },
							{ type: "text", content: " digit(s) after the decimal in " },
							{ type: "math", mathml: decimalML(decimalDigits) },
							{
								type: "text",
								content: `, so use “${unitName(places, decimalValue)},” not “${swappedUnitName(
									places,
									decimalValue
								)}.”`
							}
						]
					}
				]
			},
			{
				type: "step",
				title: [{ type: "text", content: "Combine with the whole number" }],
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								content: `Keep the whole number as “${wholeWordsCorrect},” say “and,” then use “${decimalCorrect}.”`
							}
						]
					}
				]
			}
		]
	})

	const buildCompressedAndWrongUnitFeedback =
		(): FeedbackContent<TemplateWidgets> => ({
			preamble: {
				correctness: "incorrect",
				summary: [
					{
						type: "text",
						content:
							"The whole number was compressed into tens and ones, and the decimal place value was misnamed."
					}
				]
			},
			steps: [
				{
					type: "step",
					title: [
						{ type: "text", content: "Restore the correct whole-number places" }
					],
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "text", content: "Expanded form: " },
								{ type: "math", mathml: expandedMathML }
							]
						},
						{
							type: "paragraph",
							content: [
								{
									type: "text",
									content: `The hundreds addend is ${hundreds * 100}, which must produce a “hundred” word, not just a tens word like “${twoDigitWords(
										hundreds * 10,
										useHyphen
									)}.”`
								}
							]
						}
					]
				},
				{
					type: "step",
					title: [
						{
							type: "text",
							content: "Fix the decimal unit from its digit count"
						}
					],
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "text", content: "Since " },
								{ type: "math", mathml: decimalML(decimalDigits) },
								{ type: "text", content: " = " },
								{ type: "math", mathml: decimalAsFractionML },
								{
									type: "text",
									content: `, use “${unitName(places, decimalValue)},” not “${swappedUnitName(
										places,
										decimalValue
									)}.”`
								}
							]
						}
					]
				},
				{
					type: "step",
					title: [{ type: "text", content: "Write the final wording" }],
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "text",
									content: `Whole number: ${wholeWordsCorrect}. Decimal: ${decimalCorrect}. Combine with a single “and.”`
								}
							]
						}
					]
				}
			]
		})

	const feedback: Record<
		ChoiceId,
		{ content: FeedbackContent<TemplateWidgets> }
	> = {
		A: { content: buildCorrectFeedback() },
		B: { content: buildTensAsOnesFeedback() },
		C: { content: buildCompressedAndWrongUnitFeedback() },
		D: { content: buildWrongUnitOnlyFeedback() }
	}

	const assessmentItem = {
		identifier: `expanded-form-to-words-seed-${seed.toString()}`,
		title: `Word Form from Expanded Form: ${withCommas(thousands * 1000)} + ${hundreds * 100} + ${tens * 10} + 0.${decimalDigits}`,

		body: [
			{ type: "paragraph", content: [{ type: "text", content: lead }] },
			{
				type: "paragraph",
				content: [{ type: "math", mathml: expandedMathML }]
			},
			{ type: "interactionRef", interactionId: "choice_interaction" }
		],

		widgets: null,

		interactions: {
			choice_interaction: {
				type: "choiceInteraction",
				responseIdentifier: "RESPONSE",
				prompt: [
					{ type: "text", content: question },
					{ type: "text", content: "Select one answer." }
				],
				choices: assessmentChoices.map((c) => ({
					identifier: c.identifier,
					content: [
						{
							type: "paragraph" as const,
							content: [{ type: "text" as const, content: c.label }]
						}
					]
				})),
				shuffle: true,
				minChoices: 1,
				maxChoices: 1
			}
		},

		responseDeclarations: [
			{
				identifier: "RESPONSE",
				cardinality: "single",
				baseType: "identifier",
				correct: "A"
			}
		],

		feedbackPlan,

		feedback: {
			FEEDBACK__OVERALL: {
				RESPONSE: feedback
			}
		}
	} satisfies AssessmentItemInput<TemplateWidgets, typeof feedbackPlan>

	return assessmentItem
}
