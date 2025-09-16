import { z } from "zod"
import { type WidgetCollectionName, widgetCollections } from "../../widgets/collections"
import { allWidgetSchemas } from "../../widgets/registry"
import type { ImageContext } from "../ai-context-builder"
import type { AiContextEnvelope } from "../types"
import { formatUnifiedContextSections } from "./shared"

function createWidgetMappingSchema(slotNames: string[], allowedWidgetKeys: readonly string[]) {
	const shape: Record<string, z.ZodType<string>> = {}
	for (const slotName of slotNames) {
		// MODIFIED: Allow the schema to accept either a valid widget type
		// from the collection OR the specific "WIDGET_NOT_FOUND" bail string for ALL collections.
		const validTypesAndBail = [...allowedWidgetKeys, "WIDGET_NOT_FOUND"]
		shape[slotName] = z.string().refine((val) => validTypesAndBail.includes(val), {
			message: `Must be one of: ${validTypesAndBail.join(", ")}`
		})
	}
	return z.object({
		widget_mapping: z
			.object(shape)
			.describe("A JSON object mapping each widget slot name to one of the allowed widget types or WIDGET_NOT_FOUND.")
	})
}
export function createWidgetMappingPrompt(
	envelope: AiContextEnvelope,
	assessmentBody: string,
	slotNames: string[],
	widgetCollectionName: WidgetCollectionName,
	imageContext: ImageContext
) {
	const collection = widgetCollections[widgetCollectionName]

	function buildWidgetTypeDescriptions(): string {
		// Use spread operator to convert readonly array to regular array
		const sortedKeys = [...collection.widgetTypeKeys].sort()
		return sortedKeys
			.map((typeName) => {
				// Type narrowing by iterating through the object
				const schemaEntries = Object.entries(allWidgetSchemas)
				const schemaEntry = schemaEntries.find(([key]) => key === typeName)
				if (schemaEntry) {
					const [, schema] = schemaEntry
					let description = schema?._def.description ?? "No description available."
					
					// Enhanced guidance for discreteObjectRatioDiagram
					if (typeName === "discreteObjectRatioDiagram") {
						description += `

**ENHANCED SELECTION GUIDANCE FOR discreteObjectRatioDiagram:**

Choose this widget when MOST of the following are true (treat "true" liberally):
- Many small, countable items are shown (even if irregularly spaced or not in perfect rows)
- 1-5 visually distinct item types/classes (e.g., eggs vs chicks; whales vs shark; cookies vs ice cream)
- Items are not connected by lines/edges and there are no numeric axes or bars
- Items may vary in pose, rotation, mirroring, or color shade but remain semantically the same class
- Mild overlap/occlusion is present but each item is still individually countable
- Counts are intended to be read by literally counting the items

**SELECTION CHECKLIST (yes/no):**
- countableItems: Are there multiple discrete objects that can be counted?
- fewTypes: Are there ≤5 different types of objects?
- noAxesNoBars: Are there no coordinate axes or bar chart elements?
- noConnectingLines: Are objects standalone (not connected by lines/networks)?
- variationsAreSameType: Do pose/rotation variations represent the same semantic type?
- occlusionLow: Can individual items still be distinguished and counted?

**Score = number of "yes". If Score ≥ 3, SELECT discreteObjectRatioDiagram unless a disqualifier applies.**

**TIE-BREAKER (very important):**
If both pictograph/bar-like interpretations and this widget seem plausible, PREFER discreteObjectRatioDiagram. Counting pictures is the canonical representation for ratio problems.

**NORMALIZATION RULES:**
- Treat mirrored/rotated/pose-varied instances as the same type if a human would name them the same (all "whales", "eggs", "cookies")
- Small stylistic differences do not create new types unless they clearly communicate different categories

**CONCRETE EXAMPLES:**

✅ SELECT discreteObjectRatioDiagram:
- Input: Repeated eggs and chicks scattered, no axes
  → objects: [{emoji:"🥚",count:5},{emoji:"🐥",count:3}]

- Input: Turtles and seals, mixed poses, uneven spacing  
  → objects: [{emoji:"🐢",count:6},{emoji:"🦭",count:3}]

- Input: 4 chicks and 5 penguins (from your example)
  → objects: [{emoji:"🐥",count:4},{emoji:"🐧",count:5}]

- Input: Many whales and one shark, some overlap, water spouts drawn
  → objects: [{emoji:"🐋",count:8},{emoji:"🦈",count:1}]`
					}
					
					return `- ${typeName}: ${description}`
				}
				return `- ${typeName}: No description available.`
			})
			.join("\n")
	}
	// MODIFIED: Create a base instruction and then conditionally add the refined, collection-specific rule.
	let systemInstruction = `You are an expert in educational content and QTI standards. Your task is to analyze an assessment item's body content and the original Perseus JSON to map widget slots to the most appropriate widget type from a given list.

**⚠️ CRITICAL: GRAMMATICAL ERROR CORRECTION ⚠️**
WE MUST correct any grammatical errors found in the source Perseus content. This includes:
- Spelling mistakes in words and proper nouns
- Incorrect punctuation, capitalization, and sentence structure
- Subject-verb disagreement and other grammatical issues
- Awkward phrasing that impacts clarity
- Missing or incorrect articles (a, an, the)

The goal is to produce clean, professional educational content that maintains the original meaning while fixing any language errors present in the source material.

**CRITICAL RULE: WIDGET_NOT_FOUND BAIL**
This is your most important instruction. If you determine that a widget slot **CANNOT** be reasonably mapped to any of the available widget types, you **MUST** use the exact string literal **"WIDGET_NOT_FOUND"** as its type. Do not guess or force a fit.

Use "WIDGET_NOT_FOUND" **ONLY** if:
1.  There is no semantically appropriate widget type in the provided list for the given Perseus content AND the content cannot be represented by \`emojiImage\` (for semantic objects) or \`urlImage\` (for non-semantic visuals).
2.  A slot clearly represents an interactive element that was misclassified as a widget.

**⚠️ IMPORTANT: Before using WIDGET_NOT_FOUND for any visual content, always consider:**
- Can this be mapped to \`emojiImage\` if it shows recognizable objects/things?
- Can this be mapped to \`urlImage\` if it's a static visual without specific semantic meaning?
- Is there any domain-specific widget that could represent this content?`

	// MODIFIED: Conditionally append the highly specific and clarified simple-visual instruction.
	if (widgetCollectionName === "simple-visual") {
		systemInstruction += `
3.  **For this 'simple-visual' collection ONLY**: Your primary task is to map Perseus \`image\` widgets to our \`urlImage\` widget. However, if the corresponding Perseus \`image\` widget definition is **missing its \`url\` property** or the \`url\` is an empty string, you should:
    - **FIRST**: Check if the image content represents a recognizable semantic object that could be mapped to \`emojiImage\` (animals, food, objects, etc.)
    - **SECOND**: If it's clearly a semantic object, map to \`emojiImage\` instead of bailing
    - **ONLY THEN**: Use \`WIDGET_NOT_FOUND\` if neither \`urlImage\` nor \`emojiImage\` is appropriate
    - **NOTE**: You will be provided a context map of working URLs. **Assume all URLs in that context map are valid and functional.** Your job is not to validate them, but to recognize when a URL is completely absent from the source Perseus JSON in the first place.

4.  **Reference Resources Preference (periodic table, formula sheets)**: When the assessment body or Perseus JSON clearly indicates a standard reference resource (e.g., "periodic table", "periodic table of the elements"), and this collection includes a specific widget type for it (e.g., \`periodicTable\`), you **MUST** map the corresponding slot to that specific widget type rather than a generic \`urlImage\`. This ensures consistent rendering and behavior for reference materials.`
	}

	// Conditionally add widget selection rules when urlImage is available in the collection
	const hasUrlImage = [...collection.widgetTypeKeys].includes("urlImage")
	if (hasUrlImage) {
		systemInstruction += `

**WIDGET SELECTION RULES (urlImage is a STRICT last resort)**
- **CRITICAL HIERARCHY** for visual content:
  1. FIRST: Map to a semantically specific widget that matches the content
  2. SECOND: If no specific widget fits, and the content is a truly static, non-semantic visual, then use \`urlImage\`
  3. LAST: Only use \`WIDGET_NOT_FOUND\` if the content cannot be represented by any widget including \`urlImage\`
- **Aggressive preference**: Always choose a purpose-built widget over \`urlImage\` whenever a match exists in the available list.

- Prefer specific widgets over \`urlImage\`:
  - Graphs/charts/plots: choose graph/plot widgets (e.g., \`barChart\`, \`lineGraph\`, \`conceptualGraph\`, \`scatterPlot\`, \`populationBarChart\`, etc.)
  - Tables: choose \`dataTable\`
  - Set comparisons: choose \`vennDiagram\`
  - Reference resources: choose specific resource widgets (e.g., \`periodicTable\`)
  - **CRITICAL: Semantic objects/things**: AGGRESSIVELY choose \`emojiImage\` for images of recognizable objects, animals, food, items, etc.

**⚠️ MANDATORY: emojiImage for Semantic Objects**
When you encounter raster images (PNG/JPG/GIF) or vector images (SVG) that depict recognizable real-world objects, you MUST map them to \`emojiImage\` instead of \`urlImage\` or \`WIDGET_NOT_FOUND\`. This applies to ANY identifiable object, creature, item, or thing from the real world.

**Categories of objects that MUST use emojiImage (these are just EXAMPLES - map ANY real-world object):**
- Animals: ANY animal, creature, or living thing (ladybug, whale, shark, cat, dog, bird, turtle, penguin, elephant, spider, fish, etc.)
- Food items: ANY food, drink, or edible item (pizza, cookie, hot dog, apple, banana, ice cream, bread, cheese, etc.)
- Everyday objects: ANY common item or household object (shoe, book, flower, dollar bill, key, phone, umbrella, chair, etc.)
- Tools/items: ANY tool, device, or manufactured item (video game controller, bone, toilet, cup, ball, hammer, scissors, etc.)
- Transportation: ANY vehicle or mode of transport (car, bicycle, airplane, boat, train, skateboard, etc.)
- Nature: ANY natural element or outdoor item (tree, leaf, sun, moon, star, rock, cloud, etc.)
- Clothing: ANY garment or accessory (hat, shirt, pants, jewelry, glasses, etc.)
- Sports/recreation: ANY sports equipment or recreational item (ball, racket, board game, toy, etc.)

**CRITICAL: These categories are NOT exhaustive.** If you see an image of ANYTHING that exists in the real world and can be named with a noun, map it to emojiImage. The examples above represent maybe 0.1% of all possible real-world objects.

**Selection criteria for emojiImage:**
1. The image shows a single recognizable object or simple collection of similar objects
2. The object has a reasonable emoji equivalent (even if not perfect)
3. The image is primarily illustrative/decorative rather than data-driven
4. No other specific widget type in this collection better represents the content

**DO NOT use WIDGET_NOT_FOUND for semantic objects.** The emojiImage widget can represent virtually any recognizable thing with an appropriate emoji. Be creative and liberal in your emoji selection - a close approximation is infinitely better than bailing with WIDGET_NOT_FOUND.

**UNIVERSAL RULE: If it's a "thing" in the real world, map it to emojiImage.** This includes objects that might seem unusual, obscure, or specific. When in doubt, choose emojiImage over WIDGET_NOT_FOUND for any recognizable object.

**Sample mappings (remember, these are just tiny examples of infinite possibilities):**
- Image of a ladybug → emojiImage with emoji: "🐞"
- Image of pizza slice → emojiImage with emoji: "🍕"  
- Image of a shoe → emojiImage with emoji: "👟"
- Image of toilet → emojiImage with emoji: "🚽"
- Image of dollar bill → emojiImage with emoji: "💵"
- Image of video game controller → emojiImage with emoji: "🎮"
- Image of bone → emojiImage with emoji: "🦴"
- Image of flower → emojiImage with emoji: "🌸"
- Image of book → emojiImage with emoji: "📚"
- Image of hot dog → emojiImage with emoji: "🌭"
- Image of paperclip → emojiImage with emoji: "📎"
- Image of microscope → emojiImage with emoji: "🔬"
- Image of treasure chest → emojiImage with emoji: "🗝️" or "💰"
- Image of cactus → emojiImage with emoji: "🌵"
- Image of fire extinguisher → emojiImage with emoji: "🧯"

**These examples represent less than 0.01% of possible objects. Map ANY real-world thing to emojiImage, even if it seems weird or specific.**

  - Emoji-only assets: choose \`emojiImage\`

- When \`urlImage\` MAY be acceptable (still last resort):
  - A plain photograph or illustration (e.g., a whale, a cat, a lab apparatus) where no more specific widget exists in this collection
  - Visual content that does not match any specific widget but can be displayed as a static image

**DO NOT USE urlImage for Graphie-generated graphs/charts**
- If the Perseus JSON indicates that an \`image\` is actually a graph/chart produced by Graphie, you MUST map to a graph widget and NOT to \`urlImage\`.
- Treat any \`image\` with a \`backgroundImage.url\` starting with \`web+graphie://\` (or containing \`ka-perseus-graphie\`) as a graph/chart with programmatic overlays.
- If the alt text or problem text clearly describes a graph/chart (e.g., "bar graph", "line graph", "scatter plot", axes, ticks), then map to a specific graph widget even if numbers/labels are not baked into the underlying bitmap.
- Rationale: Graphie overlays axes, ticks, and labels dynamically; we already have graph widgets that render these semantics natively and accessibly.

Example — Graphie bar graph (DO NOT map to urlImage):
\`\`\`json
{
  "widgets": {
    "image 1": {
      "type": "image",
      "options": {
        "alt": "A bar graph is shown...",
        "backgroundImage": {
          "url": "web+graphie://cdn.kastatic.org/ka-perseus-graphie/65b7bb67f52aaaa9932dc39482e8f2e516840676",
          "width": 300,
          "height": 270
        }
      }
    }
  }
}
\`\`\`
Correct mapping when graph widgets are available:
\`\`\`json
{
  "widget_mapping": {
    "image 1": "barChart" // or another specific graph widget listed in this collection
  }
}
\`\`\`

- **IMPORTANT**: Only use \`urlImage\` for graphs if and only if the collection provides no graph-capable widgets at all. Prefer domain-specific graph widgets whenever available.`
	}

	systemInstruction += `

**CRITICAL RULE**: You MUST choose a widget type from the list (or "WIDGET_NOT_FOUND") for every slot. Do not refuse or omit any slot.

**⚠️ SEMANTIC OBJECT ENFORCEMENT**: For any visual content showing recognizable real-world objects, creatures, items, or things, you MUST prefer \`emojiImage\` over \`WIDGET_NOT_FOUND\`. This applies to ALL physical objects that exist in reality and can be named with a noun - not just common ones. The emojiImage widget is specifically designed to replace arbitrary object images with appropriate emoji representations. WIDGET_NOT_FOUND should be reserved for truly unmappable content like abstract concepts, complex diagrams, or interactive elements - NOT for any identifiable real-world object.

**STRICT NAMING-BASED MAPPING RULES (DO NOT VIOLATE):**
- For science collection free-body-diagram conversions, any slot whose name starts with \`fbd_\` MUST be mapped to \`freeBodyDiagram\`.
  - Specifically: \`fbd_choice_a\`, \`fbd_choice_b\`, \`fbd_choice_c\` → \`freeBodyDiagram\`.
  - NEVER return \`WIDGET_NOT_FOUND\` for these slots.
- Choice-level visual widgets declared for multiple choice interactions (e.g., names ending with \`_choice_a\`, \`_choice_b\`, \`_choice_c\`) MUST be mapped to a concrete widget type, not \`WIDGET_NOT_FOUND\`. Inspect the scenario and choose the correct type from the allowed list.

Widget Type Options:
${[...collection.widgetTypeKeys].sort().join("\n")}

**⚠️ CRITICAL SELECTION ENFORCEMENT FOR discreteObjectRatioDiagram:**

When you encounter images with multiple discrete, countable objects (like animals, food items, toys, etc.), you MUST apply the checklist scoring system described in the widget descriptions above. Do NOT be overly conservative. The discreteObjectRatioDiagram widget is specifically designed for these scenarios and should be selected when the checklist score ≥ 3.

**MANDATORY OUTPUT CONTRACT:**
When the checklist score ≥ 3, you MUST select discreteObjectRatioDiagram and return the objects array with best-effort counts. Small counting uncertainty is acceptable; choose the most reasonable count. Do NOT use WIDGET_NOT_FOUND for countable discrete objects that clearly fit this pattern.

**COMPETING WIDGET PRIORITY:**
- bar chart, scatter plot, area chart, and line graph are DISPREFERRED when items are individually countable discrete objects
- pictograph widgets are LOWER PRIORITY than discreteObjectRatioDiagram for counting scenarios
- Default to discreteObjectRatioDiagram for multiple repeated pictures/icons/objects`

	const userContent = `Based on the source material and assessment body below, create a JSON object that maps each widget slot name to the most appropriate widget type. Use the provided context, including raster images for vision and vector images as text, to understand the content fully.

${formatUnifiedContextSections(envelope, imageContext)}

## Assessment Item Body (as structured JSON)
\`\`\`json
${assessmentBody}
\`\`\`

 MANDATORY RULES FOR CHOICE-LEVEL VISUALS:
 - Some widget slot names may follow the convention \`<responseIdentifier>__<choiceLetter>__v<index>\`. These are widgets reserved for visuals that appear INSIDE interaction choices (e.g., images/diagrams in radio choices).
 - You MUST map these choice-level widget slots to the correct widget types by inspecting the Perseus JSON for the corresponding choice content.
 - Do NOT assume these appear in the top-level body; they are intentionally absent from body and will be inserted inside choices later.

  Available Widget Types and Descriptions:
${buildWidgetTypeDescriptions()}

Your response must be a JSON object with a single key "widget_mapping", mapping every slot name from the list below to its type. If no suitable type is found, you MUST use the string "WIDGET_NOT_FOUND". However, for FBD slots (names starting with \`fbd_\`), you MUST map to \`freeBodyDiagram\` and MUST NOT use \`WIDGET_NOT_FOUND\`.

Slot Names to Map:
${slotNames.join("\n")}`

	const WidgetMappingSchema = createWidgetMappingSchema(slotNames, collection.widgetTypeKeys)
	// Resource mapping guidance (collection-aware): When Perseus includes reference resources
	// such as periodic tables and the collection supports a corresponding widget type
	// (e.g., 'periodicTable'), prefer mapping the slot to that type instead of bailing.

	return { systemInstruction, userContent, WidgetMappingSchema }
}
