import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { allWidgetsCollection } from "@/widgets/collections/all"
import type { WidgetInput } from "@/widgets/registry"
import { generateWidget } from "@/widgets/widget-generator"

export async function generateWidgetForTest(
	input: WidgetInput
): Promise<string> {
	const type = input.type
	const widgetDefinition = allWidgetsCollection.widgets[type]

	if (!widgetDefinition) {
		logger.error("widget definition not found in collection for test helper", {
			type
		})
		throw errors.new(
			`widget definition for type "${type}" not found in allWidgetsCollection`
		)
	}

	const { schema } = widgetDefinition
	const parsed = schema.safeParse(input)
	if (!parsed.success) {
		logger.error("widget schema validation failed in test helper", {
			type,
			error: parsed.error
		})
		throw errors.wrap(parsed.error, "widget schema validation")
	}

	const result = await errors.try(
		generateWidget(allWidgetsCollection, type, parsed.data)
	)
	if (result.error) {
		logger.error("widget generation failed in test helper", {
			type,
			error: result.error
		})
		throw errors.wrap(result.error, "widget generation")
	}

	return result.data
}
