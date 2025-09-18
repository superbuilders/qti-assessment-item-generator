#!/usr/bin/env bun

import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import OpenAI from "openai"
import { compile } from "./src/compiler/compiler"
import type { AssessmentItemInput } from "./src/compiler/schemas"
import { differentiateAssessmentItem } from "./src/structured/differentiator"

// Test input - plant and pot combinations
const sourceItem: AssessmentItemInput = {"body":[{"type":"paragraph","content":[{"type":"text","content":"Before sending track and field athletes to the Olympics, the U.S. holds a qualifying meet."}]},{"type":"paragraph","content":[{"type":"text","content":"The box plots below show the distances (in meters) achieved in the final round by the top "},{"type":"math","mathml":"<mn>11</mn>"},{"type":"text","content":" women's discus throwers at the "},{"type":"math","mathml":"<mn>2012</mn>"},{"type":"text","content":" Olympic Games and the top "},{"type":"math","mathml":"<mn>12</mn>"},{"type":"text","content":" women's discus throwers at the U.S. qualifying meet."}]},{"type":"blockSlot","slotId":"image_1"},{"type":"paragraph","content":[{"type":"text","content":"Which conclusion is supported by these box plots?"}]},{"type":"blockSlot","slotId":"choice_interaction"}],"title":"Interpret box plots for discus throw distances","widgets":{"image_1":{"axis":{"max":69,"min":54,"label":"Distance, in meters","tickLabels":[54,56,58,60,62,64,66,68,69]},"type":"boxPlot","width":480,"height":320,"summary":{"q1":54.5,"q3":60,"max":63,"min":54,"median":58},"boxColor":"#E8F4FD","medianColor":"#FF6B6B"}},"feedback":{"correct":[{"type":"paragraph","content":[{"type":"text","content":"Correct! The center of the Olympic final distribution is higher than the center of the U.S. qualifier distribution, so the Olympic final distances were greater on average."}]}],"incorrect":[{"type":"paragraph","content":[{"type":"text","content":"Not quite. The distributions overlap, so not all Olympic final distances are greater than all U.S. qualifier distances. Also, the spreads appear similar, and the U.S. qualifier box has a larger interquartile range."}]}]},"identifier":"olympic-discus-boxplots-interpretation","interactions":{"choice_interaction":{"type":"choiceInteraction","prompt":[{"type":"text","content":"Which conclusion is supported by these box plots? Select one answer."}],"choices":[{"content":[{"type":"paragraph","content":[{"type":"text","content":"The distances in the Olympic final were farther on average."}]}],"feedback":null,"identifier":"A"},{"content":[{"type":"paragraph","content":[{"type":"text","content":"The distances in the Olympic final were all greater than the distances in the U.S. qualifier."}]}],"feedback":null,"identifier":"B"},{"content":[{"type":"paragraph","content":[{"type":"text","content":"The distances in the Olympic final varied noticeably more than the distances in the U.S. qualifier."}]}],"feedback":null,"identifier":"C"},{"content":[{"type":"paragraph","content":[{"type":"text","content":"None of the above."}]}],"feedback":null,"identifier":"D"}],"shuffle":true,"maxChoices":1,"minChoices":1,"responseIdentifier":"choice_interaction"}},"responseDeclarations":[{"correct":"A","baseType":"identifier","identifier":"choice_interaction","cardinality":"single"}]}

async function main() {
	console.log("🌱 Starting Differentiation Test")
	console.log("=" .repeat(80))

	// Check for API key
	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey) {
		console.error("❌ Error: OPENAI_API_KEY environment variable not set")
		process.exit(1)
	}

	// Initialize OpenAI client
	const openai = new OpenAI({ apiKey })

	// Number of variations to generate
	const numVariations = 3

	console.log(`📝 Original Item: "${sourceItem.title}"`)
	console.log(`🎯 Generating ${numVariations} variations...`)
	console.log()

	// Run differentiation
	const result = await errors.try(
		differentiateAssessmentItem(openai, logger, sourceItem, numVariations)
	)

	if (result.error) {
		console.error("❌ Differentiation failed:", result.error)
		process.exit(1)
	}

	const differentiatedItems = result.data
	console.log(`✅ Successfully generated ${differentiatedItems.length} variations!`)
	console.log()

	// Display each variation
	for (let i = 0; i < differentiatedItems.length; i++) {
		const item = differentiatedItems[i]
		console.log(`📋 Variation ${i + 1}: ${item.identifier}`)
		console.log(`   Title: "${item.title}"`)
		
		// Extract some key content to show the variation
		if (item.body && item.body[0]?.type === "paragraph") {
			const firstPara = item.body[0].content[0]
			if (firstPara?.type === "text") {
				console.log(`   Opening: "${firstPara.content.substring(0, 80)}..."`)
			}
		}

		// Show widget info
		if (item.widgets) {
			const widgetKeys = Object.keys(item.widgets)
			console.log(`   Widgets: ${widgetKeys.length} (${widgetKeys.join(", ")})`)
		}

		// Show interaction info
		if (item.interactions) {
			const interactionKeys = Object.keys(item.interactions)
			console.log(`   Interactions: ${interactionKeys.length} (${interactionKeys.join(", ")})`)
		}

		console.log()
	}

	// Optionally compile one variation to XML
	console.log("📄 Compiling first variation to QTI XML...")
	const xmlResult = await errors.try(compile(differentiatedItems[0]))
	
	if (xmlResult.error) {
		console.error("❌ Compilation failed:", xmlResult.error)
	} else {
		console.log("✅ XML compilation successful!")
		console.log()
		console.log("Preview (first 500 chars):")
		console.log("-".repeat(80))
		console.log(xmlResult.data.substring(0, 500) + "...")
		console.log("-".repeat(80))
	}

	// Save outputs to files
	console.log()
	console.log("💾 Saving outputs...")
	
	// Save differentiated items as JSON
	const outputDir = "./test-output"
	await Bun.write(
		`${outputDir}/differentiated-items.json`, 
		JSON.stringify(differentiatedItems, null, 2)
	)
	console.log(`   ✓ Saved differentiated items to ${outputDir}/differentiated-items.json`)

	// Save first XML
	if (xmlResult.data) {
		await Bun.write(
			`${outputDir}/variation-1.xml`,
			xmlResult.data
		)
		console.log(`   ✓ Saved XML to ${outputDir}/variation-1.xml`)
	}

	console.log()
	console.log("🎉 Test complete!")
}

// Run the test
main().catch((error) => {
	console.error("💥 Unexpected error:", error)
	process.exit(1)
})
