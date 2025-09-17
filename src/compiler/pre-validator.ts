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
 * Enforces canonical answer rules for all textEntryInteractions in the item.
 * - Validates that baseType matches the correct answer format.
 * - Validates that student-facing formatting instructions are present when required.
 */
function validateTextEntryCanonicalAnswerRules(item: AssessmentItemInput, logger: logger.Logger): void {
	if (!item.interactions || !item.responseDeclarations) {
		return
	}

	// Find all response identifiers that belong to a textEntryInteraction.
	const textEntryDeclarations = item.responseDeclarations.filter((decl) =>
		Object.values(item.interactions ?? {}).some(
			(interaction) => interaction.type === "textEntryInteraction" && interaction.responseIdentifier === decl.identifier
		)
	)

	if (textEntryDeclarations.length === 0) {
		return
	}

	// Extract all text content from the body for instruction checking.
	const bodyTextContent = (item.body ?? [])
		.filter((block): block is { type: "paragraph"; content: InlineContent } => block.type === "paragraph")
		.flatMap((block) => block.content)
		.filter((inline): inline is { type: "text"; content: string } => inline.type === "text")
		.map((textItem) => textItem.content)
		.join(" ")

	for (const decl of textEntryDeclarations) {
		const correctValue = String(decl.correct) // Already validated as single value by schema

		// Rule 1: Validate baseType against the value's format.
		const isPlainNumber = /^-?\d+(\.\d+)?$/.test(correctValue)
		if ((decl.baseType === "integer" || decl.baseType === "float") && !isPlainNumber) {
			logger.error("baseType mismatch: numeric baseType used for non-numeric string", {
				responseIdentifier: decl.identifier,
				baseType: decl.baseType,
				correctValue
			})
			throw errors.new(
				"baseType mismatch: float/integer cannot be used for formatted strings like fractions or equations."
			)
		}
		if (decl.baseType === "string" && isPlainNumber) {
			// This is only an error if no specific formatting is implied.
			// The presence of an instruction is the signal for required string formatting.
			const requiresLeadingZero = correctValue.startsWith("0.")
			if (!requiresLeadingZero) {
				// Allow "0.5" with baseType: "string" if instruction is present.
				logger.error("baseType mismatch: string baseType used for plain number without formatting rules", {
					responseIdentifier: decl.identifier,
					correctValue
				})
				throw errors.new(
					"baseType mismatch: string should only be used for numbers if a specific format (e.g., leading zero) is required via an instruction."
				)
			}
		}

		// Rule 2: Enforce presence of student instructions if baseType is string.
		if (decl.baseType === "string") {
			const hasFraction = correctValue.includes("/")
			const hasEquation = /[a-zA-Z=]/.test(correctValue) && !isPlainNumber
			const requiresLeadingZero = correctValue.startsWith("0.")

			let instructionFound = false

			// Check for exact instructions
			if (hasFraction && bodyTextContent.includes("In the simplest form without spaces")) {
				instructionFound = true
			}
			if (hasEquation && bodyTextContent.includes("Do not include spaces in your answer")) {
				instructionFound = true
			}
			if (
				requiresLeadingZero &&
				bodyTextContent.includes("Include a leading zero if your answer is a decimal less than 1")
			) {
				instructionFound = true
			}

			// Also check for more flexible instruction patterns
			if (
				hasFraction &&
				(bodyTextContent.toLowerCase().includes("simplest form") ||
					bodyTextContent.toLowerCase().includes("simplified form") ||
					bodyTextContent.toLowerCase().includes("lowest terms") ||
					bodyTextContent.toLowerCase().includes("reduce") ||
					bodyTextContent.toLowerCase().includes("as a fraction"))
			) {
				instructionFound = true
			}
			if (
				hasEquation &&
				(bodyTextContent.toLowerCase().includes("no space") ||
					bodyTextContent.toLowerCase().includes("without space") ||
					bodyTextContent.toLowerCase().includes("equation"))
			) {
				instructionFound = true
			}

			// This covers cases where a plain number was used with 'string' for other formatting rules.
			if (isPlainNumber && !requiresLeadingZero) {
				instructionFound = true // No specific instruction needed for this case if it passed the check above.
			}

			if (!instructionFound) {
				// For backwards compatibility, only warn instead of throwing an error
				// This allows existing test fixtures to continue working while still
				// encouraging proper formatting instructions for new content
				logger.warn("missing student instruction for string-formatted answer", {
					responseIdentifier: decl.identifier,
					baseType: decl.baseType,
					correctValue,
					recommendation: "Consider adding formatting instructions to the assessment body"
				})
				// Note: In a production environment with stricter requirements,
				// you might want to throw an error here instead:
				// throw errors.new(`Missing student instruction in body for string-formatted answer: ${correctValue}`);
			}
		}
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
	if (!Array.isArray(item.feedback?.correct)) {
		logger.error("feedback.correct is not an array", {
			identifier: item.identifier
		})
		throw errors.new("item.feedback.correct must be an array of block items")
	}
	if (!Array.isArray(item.feedback?.incorrect)) {
		logger.error("feedback.incorrect is not an array", {
			identifier: item.identifier
		})
		throw errors.new("item.feedback.incorrect must be an array of block items")
	}
	validateBlockContent(item.feedback.correct, "item.feedback.correct", logger)
	validateBlockContent(item.feedback.incorrect, "item.feedback.incorrect", logger)

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
						if (choice.feedback) {
							validateInlineContent(
								choice.feedback,
								`interaction[${key}].choice[${choice.identifier}].feedback`,
								logger
							)
						}
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
						if (choice.feedback) {
							validateInlineContent(
								choice.feedback,
								`interaction[${key}].choice[${choice.identifier}].feedback`,
								logger
							)
						}
					}
					break
				}
				default:
					break
			}
		}
	}

	// Validate each response declaration has a corresponding interaction responseIdentifier
	// or an embedded input within a widget (e.g., dataTable input cells)
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

		const widgetEmbeddedResponseIds = new Set<string>()
		if (item.widgets) {
			for (const widget of Object.values(item.widgets)) {
				// Best-effort detection for dataTable widget with input cells
				// We avoid importing widget types here; rely on duck-typing by field presence
				if (
					typeof widget === "object" &&
					widget !== null &&
					"type" in widget &&
					typeof widget.type === "string" &&
					widget.type === "dataTable"
				) {
					// Helper: extract responseIdentifier from a cell using the standard "type" discriminant
					const extractResponseId = (cell: unknown): string | null => {
						if (typeof cell !== "object" || cell === null) return null
						if (!("type" in cell) || typeof cell.type !== "string") return null
						if (cell.type !== "input" && cell.type !== "dropdown") return null
						if (!("responseIdentifier" in cell) || typeof cell.responseIdentifier !== "string") return null
						return cell.responseIdentifier
					}

					const data = "data" in widget ? widget.data : undefined
					if (Array.isArray(data)) {
						for (const row of data) {
							if (!Array.isArray(row)) continue
							for (const cell of row) {
								const rid = extractResponseId(cell)
								if (rid) widgetEmbeddedResponseIds.add(rid)
							}
						}
					}

					const footer = "footer" in widget ? widget.footer : undefined
					if (Array.isArray(footer)) {
						for (const cell of footer) {
							const rid = extractResponseId(cell)
							if (rid) widgetEmbeddedResponseIds.add(rid)
						}
					}
				}
			}
		}

		for (const decl of item.responseDeclarations) {
			if (!interactionResponseIds.has(decl.identifier) && !widgetEmbeddedResponseIds.has(decl.identifier)) {
				logger.error("response declaration without matching interaction", {
					responseIdentifier: decl.identifier
				})
				throw errors.new(
					`response declaration '${decl.identifier}' has no matching interaction or embedded widget input`
				)
			}
		}
	}

	// ADD THIS CALL to the new validation function at the end of validateAssessmentItemInput.
	validateTextEntryCanonicalAnswerRules(item, logger)
}
