import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { compile } from "../src/compiler/compiler"
import type { AssessmentItemInput } from "../src/compiler/schemas"
import fractionAddition from "../src/templates/math/fraction-addition"
import { mathCoreCollection } from "../src/widgets/collections/math-core"

async function main() {
	logger.info("starting template poc test", {
		templateId: fractionAddition.templateId,
		version: fractionAddition.version
	})

	// 1. Define the input data for the template.
	// This data object conforms to FractionAdditionTemplateInput.
	const questionProps = {
		addend1: { type: "fraction", numerator: 1, denominator: 2, sign: "+" },
		addend2: { type: "fraction", numerator: 1, denominator: 3, sign: "+" }
	}
	logger.debug("defined question props", { props: questionProps })

	// 2. Validate input props against the template's schema.

	// 3. Validate input props against the template's schema.
	const validationResult = fractionAddition.propsSchema.safeParse(questionProps)
	if (!validationResult.success) {
		logger.error("template input validation failed", { error: validationResult.error })
		throw errors.wrap(validationResult.error, "template input validation")
	}

	// 4. Call the template's generate() to produce AssessmentItemInput.
	// This is a synchronous, deterministic call.
	const itemInputResult = errors.trySync(() => fractionAddition.generate(validationResult.data))
	if (itemInputResult.error) {
		logger.error("template function failed", { error: itemInputResult.error })
		throw errors.wrap(itemInputResult.error, "template generation")
	}
	const assessmentItemInput: AssessmentItemInput = itemInputResult.data
	logger.info("successfully generated assessmentiteminput from template")

	// 5. Pass the generated data structure to the compiler.
	const compileResult = await errors.try(compile(assessmentItemInput, mathCoreCollection))
	if (compileResult.error) {
		logger.error("qti compilation failed", { error: compileResult.error })
		throw errors.wrap(compileResult.error, "compilation")
	}
	const qtiXml = compileResult.data
	logger.info("successfully compiled qti xml")

	// 6. Log the final output.
	logger.info("template poc succeeded")
	logger.info("generated qti xml", {
		xml: qtiXml,
		separator: "========================================"
	})
}

// Execute the main function and handle potential errors at the top level.
const result = await errors.try(main())
if (result.error) {
	logger.error("template poc script failed", { error: result.error })
	process.exit(1)
}
