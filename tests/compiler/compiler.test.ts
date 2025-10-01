import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { XMLValidator } from "fast-xml-parser"
import { compile } from "../../src/compiler/compiler"
import { allExamples } from "../../src/examples"
import { allWidgetsCollection } from "../../src/widgets/collections/all"
import type { AssessmentItemInput } from "../../src/core/item"
import type { WidgetTypeTupleFrom } from "../../src/widgets/collections/types"

describe("QTI Compiler End-to-End Tests", () => {
	for (const example of allExamples) {
		test(`should compile example "${example.identifier}" without errors`, async () => {
			const result = await errors.try(compile(example as AssessmentItemInput<WidgetTypeTupleFrom<typeof allWidgetsCollection>>, allWidgetsCollection))
			if (result.error) {
				logger.error("compilation failed for example", {
					identifier: example.identifier,
					error: result.error
				})
			}
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test setup failed", { error: result.error })
				throw errors.new("test setup failed")
			}
			const validationResult = XMLValidator.validate(result.data, {
				allowBooleanAttributes: true
			})
			expect(validationResult).toBe(true)
		})
	}

	// Snapshot test for each example to catch any regression in XML output
	for (const example of allExamples) {
		test(`should produce consistent XML output for "${example.identifier}"`, async () => {
			const result = await errors.try(compile(example as AssessmentItemInput<WidgetTypeTupleFrom<typeof allWidgetsCollection>>, allWidgetsCollection))
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test setup failed", { error: result.error })
				throw errors.new("test setup failed")
			}

			// This will create individual snapshots for each example
			// If the output of the compiler changes for any example, the test will fail
			// To update snapshots, run bun test with the -u flag
			expect(result.data).toMatchSnapshot()
		})
	}
})
