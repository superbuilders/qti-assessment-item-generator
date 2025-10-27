import type { Logger } from "@superbuilders/slog"
import {
	createNegativeExampleSection,
	createPositiveExampleSection
} from "@/template-generator/prompts/sections/examples"
import { FEEDBACK_GUIDANCE_SECTION } from "@/template-generator/prompts/sections/feedback-guidance"
import { LITERAL_BANS_SECTION } from "@/template-generator/prompts/sections/literal-bans"
import { createSourceContextSection } from "@/template-generator/prompts/sections/qti-source"
import { SEED_GUIDANCE_SECTION } from "@/template-generator/prompts/sections/seed-guidance"
import { createSeedHelpersSection } from "@/template-generator/prompts/sections/seed-helpers"
import { SYSTEM_INSTRUCTIONS_SECTION } from "@/template-generator/prompts/sections/system-instructions"
import { createTemplateContract } from "@/template-generator/prompts/sections/template-contract"
import { TEMPLATE_PHILOSOPHY_SECTION } from "@/template-generator/prompts/sections/template-philosophy"
import { createWidgetGuidance } from "@/template-generator/prompts/sections/widget-guidance"
import {
	BASE_SYSTEM_PROMPT,
	type PromptArtifacts
} from "@/template-generator/prompts/shared"

export function composeInitialPrompt(
	logger: Logger,
	allowedWidgets: readonly string[],
	sourceContext: string
): PromptArtifacts {
	logger.debug("composing initial template prompt", { allowedWidgets })

	const sections = [
		SYSTEM_INSTRUCTIONS_SECTION,
		TEMPLATE_PHILOSOPHY_SECTION,
	SEED_GUIDANCE_SECTION,
	createSeedHelpersSection(),
	createWidgetGuidance(allowedWidgets),
	createTemplateContract(logger, allowedWidgets),
	FEEDBACK_GUIDANCE_SECTION,
	LITERAL_BANS_SECTION,
	createSourceContextSection(sourceContext),
	createPositiveExampleSection(["fraction-addition"]),
	createNegativeExampleSection(["shuffled_twice", "prompt_spacing", "readonly_choice_ids"])
	].filter(Boolean)

	const userPrompt = sections.join("\n\n")

	return {
		systemPrompt: BASE_SYSTEM_PROMPT,
		userPrompt
	}
}
