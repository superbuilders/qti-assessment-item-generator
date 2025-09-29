import * as errors from "@superbuilders/errors"
import type * as logger from "@superbuilders/slog"
import { XMLParser, XMLValidator } from "fast-xml-parser"
import {
	checkNoCDataSections,
	checkNoInvalidXmlChars,
	checkNoLatex,
	checkNoMfencedElements,
	checkNoPerseusArtifacts
} from "../qti-validation/utils"
import type { AssessmentItemInput, BlockContent, InlineContent } from "./schemas"

/**
 * Validates that a MathML fragment is well-formed XML.
 * Throws an error if the XML is malformed.
 * @param mathml The MathML string to validate.
 * @param context The context for error reporting.
 * @param logger The logger instance.
 */
function validateMathMLWellFormed(mathml: string, context: string, logger: logger.Logger): void {
	// Wrap the MathML in a root element to ensure it's a complete XML document
	const wrappedMathML = `<math xmlns="http://www.w3.org/1998/Math/MathML">${mathml}</math>`

	const validationResult = XMLValidator.validate(wrappedMathML, {
		allowBooleanAttributes: true,
		unpairedTags: [
			"br",
			"hr",
			"img",
			"area",
			"base",
			"col",
			"embed",
			"input",
			"link",
			"meta",
			"param",
			"source",
			"track",
			"wbr"
		]
	})

	if (validationResult !== true) {
		// Extract the error message
		const errorMessage =
			typeof validationResult === "object" && validationResult.err
				? validationResult.err.msg
				: "Unknown XML validation error"

		logger.error("malformed MathML XML", {
			mathml,
			context,
			error: errorMessage,
			validationResult
		})

		throw errors.new(`invalid mathml in ${context}: ${errorMessage}`)
	}
}

function validateInlineContent(items: InlineContent, _context: string, logger: logger.Logger): void {
	if (!Array.isArray(items)) {
		logger.error("inline content is not an array", { context: _context })
		throw errors.new(`${_context} must be an array of inline items`)
	}
	for (const item of items) {
		if (item.type === "text") {
			// Ensure PCDATA-safe content (ban control chars etc.)
			checkNoInvalidXmlChars(item.content, logger)
			checkNoCDataSections(item.content, logger)
			checkNoLatex(item.content, logger)
			// FIX: Restore missing Perseus artifact validation
			checkNoPerseusArtifacts(item.content, logger)

			// Strict currency/percent enforcement: raw text currency/percent are banned.
			// Require MathML tokens instead (e.g., <mo>$</mo><mn>50</mn> and <mn>5</mn><mo>%</mo>).
			const hasCurrencySpan = /<span\s+class\s*=\s*["']currency["']\s*>/i.test(item.content)
			const hasDollarNumber = /\$(?=\s*\d)/.test(item.content)
			const hasNumberPercent = /\d\s*%/.test(item.content)
			if (hasCurrencySpan || hasDollarNumber || hasNumberPercent) {
				logger.error("raw currency/percent in text content", {
					context: _context,
					text: item.content.substring(0, 120)
				})
				throw errors.new(
					"currency and percent must be expressed in MathML, not raw text (use <mo>$</mo><mn>n</mn> and <mn>n</mn><mo>%</mo>)"
				)
			}
		} else if (item.type === "math") {
			// First validate that the MathML is well-formed XML
			checkNoInvalidXmlChars(item.mathml, logger)
			checkNoCDataSections(item.mathml, logger)
			validateMathMLWellFormed(item.mathml, _context, logger)
			// Then check for deprecated elements
			checkNoMfencedElements(item.mathml, logger)

			// Reject any HTML tags embedded inside MathML fragments
			if (/<\s*(span|div|p|br|img|strong|em|code|pre)(\s|>|\/)/i.test(item.mathml)) {
				logger.error("html elements found inside mathml fragment", {
					context: _context,
					mathml: item.mathml.substring(0, 120)
				})
				throw errors.new("mathml must not contain html elements like <span>, <div>, <p>, <img>")
			}
			// Note: Input schema defines mathml as content without the outer <math> element.
			// The renderer is responsible for wrapping tokens in <math xmlns="http://www.w3.org/1998/Math/MathML">…</math>.
			// Therefore, do not reject unwrapped MathML tokens here.
			// Check for msup elements with missing children
			const msupMatches = item.mathml.match(/<msup[^>]*>(.*?)<\/msup>/gi)
			if (msupMatches) {
				for (const msupMatch of msupMatches) {
					const innerContent = msupMatch.replace(/<\/?msup[^>]*>/gi, "").trim()
					// Count child elements - msup needs exactly 2 children (base and exponent)
					const childElementCount = (innerContent.match(/<[^>]+>/g) || []).length
					if (childElementCount < 2 || innerContent.includes("<mo></mo>") || innerContent.includes("<mo />")) {
						logger.error("msup element missing required children", {
							context: _context,
							msup: msupMatch
						})
						throw errors.new("msup elements must have exactly 2 children (base and exponent)")
					}
				}
			}
			// Check for forbidden mo attributes like 'superscript'
			if (/<mo[^>]*\ssuperscript\s*=/i.test(item.mathml)) {
				logger.error("forbidden mo attribute detected", {
					context: _context,
					mathml: item.mathml.substring(0, 80)
				})
				throw errors.new("mo elements cannot have superscript attribute; use msup instead")
			}

			// Strict repeating decimal enforcement: require <mover> over the repeating part
			// Heuristic: if a decimal point is followed by a numeric token and no <mover> appears in the fragment,
			// we reject to force explicit overline usage when repeating decimals are intended.
			const hasDecimalWithoutMover = /<mo>\.<\/mo>\s*<mn>\d+<\/mn>/.test(item.mathml) && !/<mover>/i.test(item.mathml)
			if (hasDecimalWithoutMover) {
				logger.error("decimal without overline mover", {
					context: _context,
					mathml: item.mathml
				})
				throw errors.new("repeating decimals must use <mover> with an overline for the repeating part")
			}

			// Basic mfrac validation: exactly two top-level child elements (numerator and denominator)
			// Use a real XML parse to correctly handle nested <mfrac> elements in exponents, etc.
			const wrappedForParse = `<math xmlns="http://www.w3.org/1998/Math/MathML">${item.mathml}</math>`
			const parseValid = XMLValidator.validate(wrappedForParse)
			if (parseValid !== true) {
				logger.error("malformed MathML XML", {
					context: _context,
					error: parseValid
				})
				throw errors.new("invalid mathml xml")
			}
			const parser = new XMLParser({
				ignoreAttributes: false,
				preserveOrder: true
			})
			const parseResult = parser.parse(wrappedForParse)
			if (!Array.isArray(parseResult)) {
				logger.error("XML parser returned non-array result", {
					context: _context
				})
				throw errors.new("invalid xml parse result")
			}
			const ast = parseResult

			function countElementChildren(nodes: Array<Record<string, unknown>>): number {
				// Count only element nodes (ignore #text and attribute nodes)
				return nodes.filter((n) => {
					const keys = Object.keys(n)
					if (keys.length !== 1) return false
					const key = keys[0]
					return key !== "#text" && key !== ":@"
				}).length
			}

			function walk(nodes: Array<Record<string, unknown>>): void {
				for (const node of nodes) {
					for (const [key, value] of Object.entries(node)) {
						if (key === ":@" || key === "#text") continue
						const children = Array.isArray(value) ? value : []
						if (key.toLowerCase() === "mfrac") {
							const childCount = countElementChildren(children)
							if (childCount !== 2) {
								logger.error("mfrac has invalid number of children", {
									context: _context,
									mfrac: wrappedForParse.substring(0, 120)
								})
								throw errors.new("mfrac elements must have exactly 2 children (numerator and denominator)")
							}
						}
						// Recurse into children
						if (Array.isArray(children) && children.length > 0) {
							walk(children)
						}
					}
				}
			}

			walk(ast)
		}
		// inlineSlot is just a reference, no validation needed
	}
}

function validateBlockContent(items: BlockContent, _context: string, logger: logger.Logger): void {
	if (!Array.isArray(items)) {
		logger.error("block content is not an array", { context: _context })
		throw errors.new(`${_context} must be an array of block items`)
	}
	for (const item of items) {
		if (item.type === "paragraph") {
			validateInlineContent(item.content, `${_context}.paragraph`, logger)
		}
		// blockSlot is just a reference, no validation needed
	}
}

/**
 * Canonical answer rules for textEntryInteractions.
 * Intentionally minimal: only enforce that numeric baseTypes are used with numeric values.
 * All formatting instructions and canonicalization guidance are handled in prompting, not here.
 */
function validateTextEntryCanonicalAnswerRules(item: AssessmentItemInput, logger: logger.Logger): void {
	if (!item.interactions || !item.responseDeclarations) {
		return
	}

	// Find all response identifiers that belong to a textEntryInteraction.
	const textEntryDeclarations = item.responseDeclarations.filter((decl) =>
		Object.values(item.interactions ?? {}).some(
			(interaction) => {
				return interaction.type === "textEntryInteraction" && interaction.responseIdentifier === decl.identifier
			}
		)
	)

	if (textEntryDeclarations.length === 0) {
		return
	}

	for (const decl of textEntryDeclarations) {
		const correctValue = String(decl.correct)
		const isPlainNumber = /^-?\d+(\.\d+)?$/.test(correctValue)

		// Enforce: numeric base types MUST have numeric values
		if ((decl.baseType === "integer" || decl.baseType === "float") && !isPlainNumber) {
			logger.error("baseType mismatch: numeric baseType used for non-numeric string", {
				responseIdentifier: decl.identifier,
				baseType: decl.baseType,
				correctValue
			})
			throw errors.new(
				"baseType mismatch: float/integer cannot be used for formatted strings like fractions or equations"
			)
		}

		// Do not enforce instruction presence or restrict string baseType for numeric-looking answers.
		// Prompting is responsible for producing canonical formats and student-facing instructions.
	}
}

export function validateAssessmentItemInput(item: AssessmentItemInput, logger: logger.Logger): void {
	// Require at least one response declaration to avoid generating empty response-processing blocks
	if (!item.responseDeclarations || item.responseDeclarations.length === 0) {
		logger.error("no response declarations present", {
			identifier: item.identifier,
			title: item.title
		})
		throw errors.new("assessment item must declare at least one response for scoring")
	}

	if (item.body !== null) {
		if (!Array.isArray(item.body)) {
			logger.error("item body is not an array", {
				identifier: item.identifier
			})
			throw errors.new("item.body must be null or an array of block items")
		}
		validateBlockContent(item.body, "item.body", logger)
	}
	if (!Array.isArray(item.feedbackBlocks)) {
		logger.error("feedbackBlocks is not an array", {
			identifier: item.identifier
		})
		throw errors.new("item.feedbackBlocks must be an array of feedback blocks")
	}
	for (let i = 0; i < item.feedbackBlocks.length; i++) {
		const block = item.feedbackBlocks[i]
		if (!block) continue
		validateBlockContent(block.content, `item.feedbackBlocks[${i}].content`, logger)
	}

	if (item.interactions) {
		for (const [key, interaction] of Object.entries(item.interactions)) {
			switch (interaction.type) {
				case "inlineChoiceInteraction": {
					for (const choice of interaction.choices) {
						validateInlineContent(choice.content, `interaction[${key}].choice[${choice.identifier}]`, logger)
					}
					// Guard: every inlineChoiceInteraction must have a matching response declaration
					const decl = item.responseDeclarations.find((d) => d.identifier === interaction.responseIdentifier)
					if (!decl) {
						logger.error("missing inlineChoice response declaration", {
							interactionKey: key,
							responseIdentifier: interaction.responseIdentifier
						})
						throw errors.new("missing inlinechoice response declaration")
					}
					break
				}
				case "choiceInteraction": {
					if (interaction.prompt && interaction.prompt.length > 0) {
						validateInlineContent(interaction.prompt, `interaction[${key}].prompt`, logger)
					}
					if (interaction.choices.length < 2) {
						logger.error("interaction has insufficient choices", {
							interactionKey: key,
							interactionType: interaction.type,
							choiceCount: interaction.choices.length
						})
						throw errors.new(
							`${interaction.type} must have at least 2 choices, but only ${interaction.choices.length} found in interaction[${key}]`
						)
					}
					for (const choice of interaction.choices) {
						validateBlockContent(choice.content, `interaction[${key}].choice[${choice.identifier}]`, logger)
						// REMOVED: choice.feedback validation no longer needed
					}
					const decl = item.responseDeclarations.find((d) => d.identifier === interaction.responseIdentifier)
					if (!decl) {
						logger.error("response declaration without matching interaction found during cardinality check", {
							interactionKey: key,
							responseIdentifier: interaction.responseIdentifier
						})
						throw errors.new(
							`response declaration '${interaction.responseIdentifier}' has no matching interaction for cardinality check`
						)
					}
					if (decl.cardinality === "single") {
						const maxChoices = interaction.maxChoices
						if (typeof maxChoices === "number" && maxChoices > 1) {
							logger.error("cardinality mismatch: single with max-choices > 1", {
								interactionKey: key,
								responseIdentifier: interaction.responseIdentifier,
								maxChoices
							})
							throw errors.new("choiceInteraction with single cardinality must have max-choices <= 1")
						}
					}
					if (decl.cardinality === "multiple") {
						const maxChoices = interaction.maxChoices
						if (typeof maxChoices === "number" && maxChoices <= 1) {
							logger.error("cardinality mismatch: multiple with max-choices <= 1", {
								interactionKey: key,
								responseIdentifier: interaction.responseIdentifier,
								maxChoices
							})
							throw errors.new("choiceInteraction with multiple cardinality must have max-choices > 1")
						}
					}
					break
				}
				case "orderInteraction": {
					if (interaction.prompt && interaction.prompt.length > 0) {
						validateInlineContent(interaction.prompt, `interaction[${key}].prompt`, logger)
					}
					if (interaction.choices.length < 2) {
						logger.error("interaction has insufficient choices", {
							interactionKey: key,
							interactionType: interaction.type,
							choiceCount: interaction.choices.length
						})
						throw errors.new(
							`${interaction.type} must have at least 2 choices, but only ${interaction.choices.length} found in interaction[${key}]`
						)
					}
					for (const choice of interaction.choices) {
						validateBlockContent(choice.content, `interaction[${key}].choice[${choice.identifier}]`, logger)
						// REMOVED: choice.feedback validation no longer needed
					}
					break
				}
				case "gapMatchInteraction": {
					// Validate gap texts
					if (interaction.gapTexts.length < 1) {
						logger.error("gap match interaction has no gap texts", {
							interactionKey: key
						})
						throw errors.new(`gap match interaction must have at least one draggable item in interaction[${key}]`)
					}
					for (const gapText of interaction.gapTexts) {
						validateInlineContent(gapText.content, `interaction[${key}].gapText[${gapText.identifier}]`, logger)
					}

					// Validate gaps are defined
					if (interaction.gaps.length < 1) {
						logger.error("gap match interaction has no gaps defined", {
							interactionKey: key
						})
						throw errors.new(`gap match interaction must define at least one gap in interaction[${key}]`)
					}

					// Validate response declaration exists and is correct type
					const decl = item.responseDeclarations.find((d) => d.identifier === interaction.responseIdentifier)
					if (!decl) {
						logger.error("missing gap match response declaration", {
							interactionKey: key,
							responseIdentifier: interaction.responseIdentifier
						})
						throw errors.new("missing gap match response declaration")
					}
					if (decl.baseType !== "directedPair") {
						logger.error("gap match requires directedPair base type", {
							interactionKey: key,
							responseIdentifier: interaction.responseIdentifier,
							actualBaseType: decl.baseType
						})
						throw errors.new("gap match interaction requires directedPair response declaration")
					}
					break
				}
				default:
					break
			}
		}
	}

	// Validate each response declaration has a corresponding interaction responseIdentifier
	// Note: dataTable widgets have been removed
	if (item.responseDeclarations.length > 0) {
		// Guard: identifier base-type with single cardinality must have exactly one correct value
		for (const decl of item.responseDeclarations) {
			if (decl.baseType === "identifier" && decl.cardinality === "single") {
				if (Array.isArray(decl.correct) && decl.correct.length > 1) {
					logger.error("single cardinality has multiple correct identifiers", {
						responseIdentifier: decl.identifier,
						count: decl.correct.length
					})
					throw errors.new("single cardinality requires one correct identifier")
				}
			}
		}
		const interactionResponseIds = new Set<string>()
		if (item.interactions) {
			for (const interaction of Object.values(item.interactions)) {
				interactionResponseIds.add(interaction.responseIdentifier)
			}
		}

		for (const decl of item.responseDeclarations) {
			if (!interactionResponseIds.has(decl.identifier)) {
				logger.error("response declaration without matching interaction", {
					responseIdentifier: decl.identifier
				})
				throw errors.new(`response declaration '${decl.identifier}' has no matching interaction`)
			}
		}
	}

	// ADD THIS CALL to the new validation function at the end of validateAssessmentItemInput.
	validateTextEntryCanonicalAnswerRules(item, logger)
}
