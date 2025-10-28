import type { Logger } from "@superbuilders/slog"
import {
	createNegativeExampleSection,
	createPositiveExampleSection
} from "@/template-generator/prompts/sections/examples"
import { FEEDBACK_GUIDANCE_SECTION } from "@/template-generator/prompts/sections/feedback-guidance"
import { LITERAL_BANS_SECTION } from "@/template-generator/prompts/sections/literal-bans"
import { createSourceContextSection } from "@/template-generator/prompts/sections/qti-source"
import { createRetryDiagnosticsSection } from "@/template-generator/prompts/sections/retry-hints"
import { SEED_GUIDANCE_SECTION } from "@/template-generator/prompts/sections/seed-guidance"
import { createSeedHelpersSection } from "@/template-generator/prompts/sections/seed-helpers"
import { SYSTEM_INSTRUCTIONS_SECTION } from "@/template-generator/prompts/sections/system-instructions"
import { createTemplateContract } from "@/template-generator/prompts/sections/template-contract"
import { TEMPLATE_PHILOSOPHY_SECTION } from "@/template-generator/prompts/sections/template-philosophy"
import { createWidgetGuidance } from "@/template-generator/prompts/sections/widget-guidance"
import { NON_NULL_BANS_SECTION } from "@/template-generator/prompts/sections/non-null-bans"
import { TYPE_ASSERTION_BANS_SECTION } from "@/template-generator/prompts/sections/type-assertion-bans"
import {
	BASE_SYSTEM_PROMPT,
	type PromptArtifacts
} from "@/template-generator/prompts/shared"
import type { TypeScriptDiagnostic } from "@/template-generator/types"
import { createWidgetHelperSections } from "@/template-generator/widget-helpers"

export function composeRetryPrompt(
	logger: Logger,
	allowedWidgets: readonly string[],
	sourceContext: string,
	previousCode: string,
	diagnostics: TypeScriptDiagnostic[]
): PromptArtifacts {
	logger.debug("composing retry template prompt", {
		allowedWidgets,
		diagnosticsCount: diagnostics.length
	})

	const baseSections = [
		SYSTEM_INSTRUCTIONS_SECTION,
		TEMPLATE_PHILOSOPHY_SECTION,
		SEED_GUIDANCE_SECTION,
		createSeedHelpersSection(),
		createWidgetGuidance(allowedWidgets),
		createTemplateContract(logger, allowedWidgets),
		FEEDBACK_GUIDANCE_SECTION,
		LITERAL_BANS_SECTION,
		NON_NULL_BANS_SECTION,
		TYPE_ASSERTION_BANS_SECTION,
		createRetryDiagnosticsSection(diagnostics),
		createSourceContextSection(sourceContext),
		createPositiveExampleSection(["fraction-addition"]),
		createNegativeExampleSection([
			"shuffled_twice",
			"prompt_spacing",
			"readonly_choice_ids"
		])
	].filter((section): section is string => Boolean(section))

	const widgetHelperSections = createWidgetHelperSections(
		logger,
		allowedWidgets
	)

	const previousBlock = `### PREVIOUS_ATTEMPT
<previous_code>
${previousCode.trim()}
</previous_code>`

	const userPrompt = `${[...baseSections, ...widgetHelperSections].join(
		"\n\n"
	)}\n\n${previousBlock}`

	return {
		systemPrompt: BASE_SYSTEM_PROMPT,
		userPrompt
	}
}
