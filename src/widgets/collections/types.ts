import type { z } from "zod"

export type WidgetCollection = {
	readonly name: string
	readonly widgetTypeKeys: readonly string[]
	readonly schemas: Record<string, z.ZodTypeAny>
}


