import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { escapeXmlAttribute } from "../utils/xml-utils"
import type { AssessmentItem, AnyInteraction } from "./schemas"

type ResponseDeclaration = AssessmentItem["responseDeclarations"][0]

export function compileResponseDeclarations(decls: AssessmentItem["responseDeclarations"]): string {
	return decls
		.map((decl) => {
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
					.map((p: unknown) => {
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
					.map((p: unknown) => {
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
					(v: unknown) =>
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
					.map((v: unknown) => {
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

function generateProcessingForInteraction(decl: ResponseDeclaration, interaction?: AnyInteraction): string {
	const responseId = escapeXmlAttribute(decl.identifier)
	const isEnumerated = interaction && (interaction.type === 'choiceInteraction' || interaction.type === 'inlineChoiceInteraction')

	if (isEnumerated) {
		const outcomeId = `FEEDBACK__${responseId}`
		if (decl.cardinality === 'multiple') {
			return `
    <qti-set-outcome-value identifier="${outcomeId}">
        <qti-variable identifier="${responseId}"/>
    </qti-set-outcome-value>`
		}
		const conditions = interaction.choices.map((choice, index) => {
			const tag = index === 0 ? 'qti-response-if' : 'qti-response-else-if'
			const choiceId = escapeXmlAttribute(choice.identifier)
			return `
        <${tag}>
            <qti-match>
                <qti-variable identifier="${responseId}"/>
                <qti-base-value base-type="identifier">${choiceId}</qti-base-value>
            </qti-match>
            <qti-set-outcome-value identifier="${outcomeId}">
                <qti-base-value base-type="identifier">${choiceId}</qti-base-value>
            </qti-set-outcome-value>
        </${tag}>`
		}).join('')
		return `<qti-response-condition>${conditions}</qti-response-condition>`
	}
	
	const outcomeId = `FEEDBACK__GLOBAL`
	return `
    <qti-response-condition>
        <qti-response-if>
            <qti-match>
                <qti-variable identifier="${responseId}"/>
                <qti-correct identifier="${responseId}"/>
            </qti-match>
            <qti-set-outcome-value identifier="${outcomeId}">
                <qti-base-value base-type="identifier">CORRECT</qti-base-value>
            </qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
            <qti-set-outcome-value identifier="${outcomeId}">
                <qti-base-value base-type="identifier">INCORRECT</qti-base-value>
            </qti-set-outcome-value>
        </qti-response-else>
    </qti-response-condition>`
}

export function compileResponseProcessing(item: AssessmentItem): string {
	const processingRules: string[] = []

	// 1. Generate feedback outcome logic for each interaction.
	for (const decl of item.responseDeclarations) {
		const interaction = Object.values(item.interactions ?? {}).find(
			(inter) => inter.responseIdentifier === decl.identifier
		)
		processingRules.push(generateProcessingForInteraction(decl, interaction))
	}

	// 2. Generate scoring logic based on the correctness of all interactions.
	const scoreConditions = item.responseDeclarations.map(decl => {
		const responseId = escapeXmlAttribute(decl.identifier)
		return `<qti-match><qti-variable identifier="${responseId}"/><qti-correct identifier="${responseId}"/></qti-match>`
	}).join('\n                        ')

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
