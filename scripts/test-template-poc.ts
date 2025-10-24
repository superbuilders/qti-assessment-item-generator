import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { compile } from "@/compiler/compiler"
import fractionAddition from "@/templates/math/fraction-addition"
import { allWidgetsCollection } from "@/widgets/collections/all"
import { createSubsetCollection } from "@/widgets/collections/subset"

async function main() {
	// Create a subset collection containing only the widgets used by this template
	const templateCollection = createSubsetCollection(allWidgetsCollection, [
		"partitionedShape"
	] as const)
	logger.info("starting template poc test", {
		templateId: fractionAddition.templateId,
		version: fractionAddition.version
	})

	const exampleSeeds = [123n, 456n, 789n]

	for (const seed of exampleSeeds) {
		logger.info("generating example from seed", { seed: seed.toString() })
		const questionProps = { seed }

		const validationResult =
			fractionAddition.propsSchema.safeParse(questionProps)
		if (!validationResult.success) {
			logger.error("template input validation failed", {
				seed: seed.toString(),
				error: validationResult.error
			})
			throw errors.wrap(validationResult.error, "template input validation")
		}

		const itemInputResult = errors.trySync(() =>
			fractionAddition.generate(validationResult.data)
		)
		if (itemInputResult.error) {
			logger.error("template function failed", {
				seed: seed.toString(),
				error: itemInputResult.error
			})
			throw errors.wrap(itemInputResult.error, "template generation")
		}
		const assessmentItemInput = itemInputResult.data
		logger.info("generated assessmentiteminput", {
			seed: seed.toString(),
			identifier: assessmentItemInput.identifier,
			title: assessmentItemInput.title
		})

		const compileResult = await errors.try(
			compile(assessmentItemInput, templateCollection)
		)
		if (compileResult.error) {
			logger.error("qti compilation failed", {
				seed: seed.toString(),
				error: compileResult.error
			})
			throw errors.wrap(compileResult.error, "compilation")
		}
		const qtiXml = compileResult.data
		logger.info("successfully compiled qti xml", { seed: seed.toString() })
		logger.info("generated qti xml", {
			seed: seed.toString(),
			xml: qtiXml,
			separator: "========================================"
		})
	}

	logger.info("template poc succeeded for all seeds")
}

// Execute the main function and handle potential errors at the top level.
const result = await errors.try(main())
if (result.error) {
	logger.error("template poc script failed", { error: result.error })
	process.exit(1)
}
