import { escapeXmlAttribute } from "../utils/xml-utils"
import type { AssessmentItem } from "./schemas"

export function compileResponseDeclarations(decls: AssessmentItem["responseDeclarations"]): string {
	return decls
		.map((decl) => {
			const correctValues = Array.isArray(decl.correct) ? decl.correct : [decl.correct]

			// Directly map the provided correct values without generating any alternatives.
			// This ensures that whatever canonical format the AI determined (numeric, fraction, or algebraic)
			// is the only one included in the QTI item.
			const correctXml = correctValues
				.map(
					(v) =>
						`<qti-value>${String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</qti-value>`
				)
				.join("\n            ")

			let xml = `\n    <qti-response-declaration identifier="${escapeXmlAttribute(
				decl.identifier
			)}" cardinality="${escapeXmlAttribute(decl.cardinality)}" base-type="${escapeXmlAttribute(decl.baseType)}">
        <qti-correct-response>
            ${correctXml}
        </qti-correct-response>`

			// For single-cardinality responses, also emit a mapping that awards 1 point for the
			// canonical value. This enables robust scoring using mapping semantics.
			const isSingleResponse =
				decl.cardinality === "single" &&
				(decl.baseType === "string" || decl.baseType === "integer" || decl.baseType === "float")
			if (isSingleResponse) {
				const mappingXml = correctValues
					.map((v) => `\n            <qti-map-entry map-key="${escapeXmlAttribute(String(v))}" mapped-value="1"/>`)
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
