import { describe, it, expect } from "bun:test"
import { z } from "zod"
import { allWidgetSchemas } from "@/widgets/registry"

type $ZodType = z.core.$ZodType

type Offender = {
	widget: string
	nodeType: string
	path: Array<string | number>
}

function findOptionalsInSchema(widgetKey: string, schema: $ZodType): Offender[] {
	const offenders: Offender[] = []

	// Use zod's JSON Schema traversal hook to visit every node and detect optional wrappers
	try {
		z.toJSONSchema(schema, {
			target: "draft-2020-12",
			io: "input",
			// The override callback is invoked for each visited Zod schema node (non-parent clones)
			override: ({ zodSchema, path }) => {
				const internal = zodSchema._zod
				const nodeType = internal?.def?.type
				if (nodeType === "optional") {
					offenders.push({ widget: widgetKey, nodeType, path })
				}
			}
		})
	} catch {
		// If conversion fails for any reason, surface it as an offender for visibility
		offenders.push({ widget: widgetKey, nodeType: "conversion_error", path: [] })
	}

	return offenders
}

describe("Widgets: no usage of Zod .optional() anywhere", () => {
	it("ensures all widget schemas contain no optional wrappers (use .nullable() for optional fields)", () => {
		const allOffenders: Offender[] = []
		for (const [widgetKey, schema] of Object.entries(allWidgetSchemas)) {
			allOffenders.push(...findOptionalsInSchema(widgetKey, schema))
		}

		if (allOffenders.length > 0) {
			const details = allOffenders
				.map((o) => `${o.widget} :: ${o.nodeType} at jsonPath=${JSON.stringify(o.path)}`)
				.join("\n")
			expect(`Found optional() in widget schemas:\n${details}`).toBe("")
		} else {
			expect(allOffenders.length).toBe(0)
		}
	})
})

