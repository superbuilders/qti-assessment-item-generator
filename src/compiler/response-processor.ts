import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { escapeXmlAttribute } from "../utils/xml-utils"
import type { AssessmentItem } from "./schemas"

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

export function compileResponseProcessing(decls: AssessmentItem["responseDeclarations"]): string {
	// Prefer mapping-based response processing only for the specific, safe case of a
	// single string/single response. This avoids regressions for other interaction types.
	const onlyDecl = decls.length === 1 ? decls[0] : undefined
	if (onlyDecl && onlyDecl.cardinality === "single" && onlyDecl.baseType === "string") {
		const responseId = escapeXmlAttribute(onlyDecl.identifier)
		return `\n    <qti-response-processing>\n        <!-- Map the candidate response to SCORE using the declaration's qti-mapping -->\n        <qti-set-outcome-value identifier="SCORE"><qti-map-response identifier="${responseId}"/></qti-set-outcome-value>\n\n        <!-- Derive FEEDBACK from SCORE without altering other semantics -->\n        <qti-response-condition>\n            <qti-response-if>\n                <qti-gt>\n                    <qti-variable identifier="SCORE"/>\n                    <qti-base-value base-type="float">0</qti-base-value>\n                </qti-gt>\n                <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">CORRECT</qti-base-value></qti-set-outcome-value>\n            </qti-response-if>\n            <qti-response-else>\n                <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">INCORRECT</qti-base-value></qti-set-outcome-value>\n            </qti-response-else>\n        </qti-response-condition>\n    </qti-response-processing>`
	}

	// Special handling for gap match with empty response allowed
	if (onlyDecl && onlyDecl.baseType === "directedPair") {
		const responseId = escapeXmlAttribute(onlyDecl.identifier)
		// Check if empty response is allowed (for cases like "no commas needed")
		// Use property checking instead of type assertion
		const allowEmpty = "allowEmpty" in onlyDecl && onlyDecl.allowEmpty === true

		if (allowEmpty) {
			return `\n    <qti-response-processing>
        <qti-response-condition>
            <qti-response-if>
                <!-- Check if response is empty (null) -->
                <qti-is-null>
                    <qti-variable identifier="${responseId}"/>
                </qti-is-null>
                <qti-set-outcome-value identifier="SCORE">
                    <qti-base-value base-type="float">1</qti-base-value>
                </qti-set-outcome-value>
                <qti-set-outcome-value identifier="FEEDBACK">
                    <qti-base-value base-type="identifier">CORRECT</qti-base-value>
                </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
                <!-- Response not empty, so it's incorrect -->
                <qti-set-outcome-value identifier="SCORE">
                    <qti-base-value base-type="float">0</qti-base-value>
                </qti-set-outcome-value>
                <qti-set-outcome-value identifier="FEEDBACK">
                    <qti-base-value base-type="identifier">INCORRECT</qti-base-value>
                </qti-set-outcome-value>
            </qti-response-else>
        </qti-response-condition>
    </qti-response-processing>`
		}

		// Standard gap match processing using mapping
		return `\n    <qti-response-processing>\n        <!-- Map the candidate response to SCORE using the declaration's qti-mapping -->\n        <qti-set-outcome-value identifier="SCORE">\n            <qti-map-response identifier="${responseId}"/>\n        </qti-set-outcome-value>\n        \n        <!-- Set feedback based on score -->\n        <qti-response-condition>\n            <qti-response-if>\n                <!-- Check if all associations are correct (full score) -->\n                <qti-equal tolerance-mode="exact">\n                    <qti-variable identifier="SCORE"/>\n                    <qti-base-value base-type="float">${Array.isArray(onlyDecl.correct) ? onlyDecl.correct.length : 0}.0</qti-base-value>\n                </qti-equal>\n                <qti-set-outcome-value identifier="FEEDBACK">\n                    <qti-base-value base-type="identifier">CORRECT</qti-base-value>\n                </qti-set-outcome-value>\n            </qti-response-if>\n            <qti-response-else>\n                <qti-set-outcome-value identifier="FEEDBACK">\n                    <qti-base-value base-type="identifier">INCORRECT</qti-base-value>\n                </qti-set-outcome-value>\n            </qti-response-else>\n        </qti-response-condition>\n    </qti-response-processing>`
	}

	const conditions = decls
		.map((decl) => {
			// For single/string responses, prefer mapping-based validation even in multi-declaration items.
			if (decl.cardinality === "single" && decl.baseType === "string") {
				const id = escapeXmlAttribute(decl.identifier)
				// Check that mapped score > 0 using the declaration's qti-mapping
				return `<qti-gt><qti-map-response identifier="${id}"/><qti-base-value base-type="float">0</qti-base-value></qti-gt>`
			}

			// Otherwise, fall back to strict match against the declared correct value(s)
			const variable = `<qti-variable identifier="${escapeXmlAttribute(decl.identifier)}"/>`
			const correct = `<qti-correct identifier="${escapeXmlAttribute(decl.identifier)}"/>`
			return `<qti-match>${variable}${correct}</qti-match>`
		})
		.join("\n                    ")

	return `
    <qti-response-processing>
        <qti-response-condition>
            <qti-response-if>
                <qti-and>
                    ${conditions}
                </qti-and>
                <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
                <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">CORRECT</qti-base-value></qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
                <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">0</qti-base-value></qti-set-outcome-value>
                <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">INCORRECT</qti-base-value></qti-set-outcome-value>
            </qti-response-else>
        </qti-response-condition>
    </qti-response-processing>`
}
