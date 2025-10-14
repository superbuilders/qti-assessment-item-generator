import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { FeedbackContent } from "@/core/content"
import type { FeedbackDimension, FeedbackPlan } from "@/core/feedback"
import type { AssessmentItem } from "@/core/item"
import { escapeXmlAttribute } from "./utils/xml-utils"

// Internal type for compilation after nested feedback has been flattened
type AssessmentItemWithFeedbackBlocks<E extends readonly string[]> = Omit<AssessmentItem<E>, "feedback"> & {
	feedbackBlocks: Record<string, FeedbackContent<E>>
}

export function compileResponseDeclarations<E extends readonly string[]>(
	decls: AssessmentItem<E>["responseDeclarations"]
): string {
	return decls
		.map((decl): string => {
			// Handle directedPair base type separately
			if (decl.baseType === "directedPair") {
				// Type narrowing: when baseType is "directedPair", correct is an array of {source, target} objects
				// Using type guard to safely access the correct property structure
				if (!Array.isArray(decl.correct)) {
					logger.error("directedPair response missing array", {
						identifier: decl.identifier,
						correctType: typeof decl.correct
					})
					throw errors.new("directedPair response must have array of correct values")
				}
				const pairs = decl.correct
				const correctXml = pairs
					.map((p: unknown): string => {
						if (typeof p !== "object" || p === null) {
							logger.error("invalid directedPair correct value", { identifier: decl.identifier, value: p })
							throw errors.new("invalid directedPair correct value structure")
						}
						const sourceDesc = Object.getOwnPropertyDescriptor(p, "source")
						const targetDesc = Object.getOwnPropertyDescriptor(p, "target")
						if (!sourceDesc || !targetDesc) {
							logger.error("invalid directedPair correct value", { identifier: decl.identifier, value: p })
							throw errors.new("invalid directedPair correct value structure")
						}
						const source = String(sourceDesc.value)
						const target = String(targetDesc.value)
						return `<qti-value>${escapeXmlAttribute(source)} ${escapeXmlAttribute(target)}</qti-value>`
					})
					.join("\n            ")

				// Add mapping for partial credit (1 point per correct association)
				const mappingXml = pairs
					.map((p: unknown): string => {
						if (typeof p !== "object" || p === null) {
							logger.error("invalid directedPair value for mapping", { identifier: decl.identifier, value: p })
							throw errors.new("invalid directedPair correct value for mapping")
						}
						const sourceDesc = Object.getOwnPropertyDescriptor(p, "source")
						const targetDesc = Object.getOwnPropertyDescriptor(p, "target")
						if (!sourceDesc || !targetDesc) {
							logger.error("invalid directedPair value for mapping", { identifier: decl.identifier, value: p })
							throw errors.new("invalid directedPair correct value for mapping")
						}
						const source = String(sourceDesc.value)
						const target = String(targetDesc.value)
						return `\n            <qti-map-entry map-key="${escapeXmlAttribute(source)} ${escapeXmlAttribute(target)}" mapped-value="1"/>`
					})
					.join("")

				return `\n    <qti-response-declaration identifier="${escapeXmlAttribute(
					decl.identifier
				)}" cardinality="${escapeXmlAttribute(decl.cardinality)}" base-type="directedPair">
        <qti-correct-response>
            ${correctXml}
        </qti-correct-response>
        <qti-mapping lower-bound="0" upper-bound="${pairs.length}" default-value="0">${mappingXml}
        </qti-mapping>
    </qti-response-declaration>`
			}

			// Handle other base types (original code)
			const correctValues = Array.isArray(decl.correct) ? decl.correct : [decl.correct]

			// Directly map the provided correct values without generating any alternatives.
			const correctXml = correctValues
				.map(
					(v: unknown): string =>
						`<qti-value>${String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</qti-value>`
				)
				.join("\n            ")

			let xml = `\n    <qti-response-declaration identifier="${escapeXmlAttribute(
				decl.identifier
			)}" cardinality="${escapeXmlAttribute(decl.cardinality)}" base-type="${escapeXmlAttribute(decl.baseType)}">
        <qti-correct-response>
            ${correctXml}
        </qti-correct-response>`

			// For single-cardinality responses, also emit a mapping that awards 1 point.
			const isSingleResponse =
				decl.cardinality === "single" &&
				(decl.baseType === "string" || decl.baseType === "integer" || decl.baseType === "float")
			if (isSingleResponse) {
				const mappingXml = correctValues
					.map((v: unknown): string => {
						const key = typeof v === "string" || typeof v === "number" ? String(v) : ""
						return `\n            <qti-map-entry map-key="${escapeXmlAttribute(key)}" mapped-value="1"/>`
					})
					.join("")

				xml += `\n        <qti-mapping default-value="0">${mappingXml}\n        </qti-mapping>`
			}

			xml += "\n    </qti-response-declaration>"
			return xml
		})
		.join("")
}

function generateComboModeProcessing<E extends readonly string[]>(item: AssessmentItemWithFeedbackBlocks<E>): string {
	const { dimensions, combinations } = item.feedbackPlan

	function buildConditionTree(
		dims: FeedbackDimension[],
		pathSegments: Array<{ responseIdentifier: string; key: string }>
	): string {
		if (dims.length === 0) {
			const matchingCombo = combinations.find((combo: FeedbackPlan["combinations"][number]): boolean => {
				if (combo.path.length !== pathSegments.length) return false
				return combo.path.every(
					(seg: FeedbackPlan["combinations"][number]["path"][number], i: number): boolean =>
						seg.responseIdentifier === pathSegments[i].responseIdentifier && seg.key === pathSegments[i].key
				)
			})
			if (!matchingCombo) {
				logger.error("no combination found for path", { pathSegments })
				throw errors.new("no combination found for path")
			}
			return `
            <qti-set-outcome-value identifier="FEEDBACK__OVERALL">
                <qti-base-value base-type="identifier">${escapeXmlAttribute(matchingCombo.id)}</qti-base-value>
            </qti-set-outcome-value>`
		}

		const [currentDim, ...restDims] = dims
		if (!currentDim) {
			logger.error("unexpected empty dimension in condition tree")
			throw errors.new("unexpected empty dimension")
		}
		const responseId = escapeXmlAttribute(currentDim.responseIdentifier)

		if (currentDim.kind === "enumerated") {
			const conditions = currentDim.keys
				.map((key, index): string => {
					const tag = index === 0 ? "qti-response-if" : "qti-response-else-if"
					const choiceId = escapeXmlAttribute(key)
					const newPathSegments = [...pathSegments, { responseIdentifier: currentDim.responseIdentifier, key }]
					const innerContent = buildConditionTree(restDims, newPathSegments)

					return `
        <${tag}>
            <qti-match>
                <qti-variable identifier="${responseId}"/>
                <qti-base-value base-type="identifier">${choiceId}</qti-base-value>
            </qti-match>${innerContent}
        </${tag}>`
				})
				.join("")
			return `
    <qti-response-condition>${conditions}
    </qti-response-condition>`
		}

		const correctPath = [...pathSegments, { responseIdentifier: currentDim.responseIdentifier, key: "CORRECT" }]
		const incorrectPath = [...pathSegments, { responseIdentifier: currentDim.responseIdentifier, key: "INCORRECT" }]
		const correctBranch = buildConditionTree(restDims, correctPath)
		const incorrectBranch = buildConditionTree(restDims, incorrectPath)

		return `
    <qti-response-condition>
        <qti-response-if>
            <qti-match>
                <qti-variable identifier="${responseId}"/>
                <qti-correct identifier="${responseId}"/>
            </qti-match>${correctBranch}
        </qti-response-if>
        <qti-response-else>${incorrectBranch}
        </qti-response-else>
    </qti-response-condition>`
	}

	return buildConditionTree(dimensions, [])
}

function generateFallbackModeProcessing<E extends readonly string[]>(
	item: AssessmentItemWithFeedbackBlocks<E>
): string {
	if (item.feedbackPlan.dimensions.length === 0) {
		logger.error("no dimensions for fallback mode processing", { itemIdentifier: item.identifier })
		throw errors.new("fallback mode requires at least one dimension")
	}

	const matchConditions = item.feedbackPlan.dimensions.map(
		(dim: FeedbackDimension): string =>
			`<qti-match><qti-variable identifier="${escapeXmlAttribute(dim.responseIdentifier)}"/><qti-correct identifier="${escapeXmlAttribute(dim.responseIdentifier)}"/></qti-match>`
	)

	const allCorrectCondition =
		matchConditions.length === 1
			? matchConditions[0]
			: `<qti-and>
                    ${matchConditions.join("\n                        ")}
                </qti-and>`

	return `
    <qti-response-condition>
        <qti-response-if>
            ${allCorrectCondition}
            <qti-set-outcome-value identifier="FEEDBACK__OVERALL">
                <qti-base-value base-type="identifier">CORRECT</qti-base-value>
            </qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
            <qti-set-outcome-value identifier="FEEDBACK__OVERALL">
                <qti-base-value base-type="identifier">INCORRECT</qti-base-value>
            </qti-set-outcome-value>
        </qti-response-else>
    </qti-response-condition>`
}

export function compileResponseProcessing<E extends readonly string[]>(
	item: AssessmentItemWithFeedbackBlocks<E>
): string {
	const processingRules: string[] = []
	const { feedbackPlan } = item

	logger.info("compiling response processing", {
		mode: feedbackPlan.mode,
		itemIdentifier: item.identifier,
		dimensionCount: feedbackPlan.dimensions.length
	})

	if (feedbackPlan.mode === "combo") {
		processingRules.push(generateComboModeProcessing(item))
	} else {
		processingRules.push(generateFallbackModeProcessing(item))
	}

	const scoreConditions = item.responseDeclarations
		.map((decl): string => {
			const responseId = escapeXmlAttribute(decl.identifier)
			return `<qti-match><qti-variable identifier="${responseId}"/><qti-correct identifier="${responseId}"/></qti-match>`
		})
		.join("\n                        ")

	processingRules.push(`
    <qti-response-condition>
        <qti-response-if>
            <qti-and>
                ${scoreConditions}
            </qti-and>
            <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1.0</qti-base-value></qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
            <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">0.0</qti-base-value></qti-set-outcome-value>
        </qti-response-else>
    </qti-response-condition>`)

	return `
    <qti-response-processing>
        ${processingRules.join("\n")}
    </qti-response-processing>`
}
