import * as errors from "@superbuilders/errors";
import * as logger from "@superbuilders/slog";
import { compile } from "../src/compiler/compiler";
import { generateFractionAdditionQuestion } from "../src/templates/math/fraction-addition";

async function main() {
	logger.info("starting template poc test");

	// 1. Define the input data for the template.
	// This data object conforms to FractionAdditionTemplateInput.
	const questionProps = {
		addend1: { numerator: 1, denominator: 2 },
		addend2: { numerator: 1, denominator: 3 },
	};
	logger.debug("defined question props", { props: questionProps });

	// 2. Call the template function to generate the AssessmentItemInput.
	// This is a synchronous, deterministic call.
	const itemInputResult = errors.trySync(() => generateFractionAdditionQuestion(questionProps));
	if (itemInputResult.error) {
		logger.error("template function failed", { error: itemInputResult.error });
		throw errors.wrap(itemInputResult.error, "template generation");
	}
	const assessmentItemInput = itemInputResult.data;
	logger.info("successfully generated assessmentiteminput from template");

	// 3. Pass the generated data structure to the compiler.
	const compileResult = await errors.try(compile(assessmentItemInput));
	if (compileResult.error) {
		logger.error("qti compilation failed", { error: compileResult.error });
		throw errors.wrap(compileResult.error, "compilation");
	}
	const qtiXml = compileResult.data;
	logger.info("successfully compiled qti xml");

	// 4. Log the final output.
	console.log("\n✅ Template POC Succeeded!");
	console.log("✨ Generated QTI 3.0 XML ✨\n");
	console.log("========================================");
	console.log(qtiXml);
	console.log("========================================");
}

// Execute the main function and handle potential errors at the top level.
const result = await errors.try(main());
if (result.error) {
	logger.error("template poc script failed", { error: result.error });
	process.exit(1);
}
