import type { WidgetTypeTuple } from "@widgets/collections/types"

export type InlineContentItem<E extends WidgetTypeTuple> =
	| { type: "text"; content: string }
	| { type: "math"; mathml: string }
	| { type: "inlineWidgetRef"; widgetId: string; widgetType: E[number] }
	| { type: "inlineInteractionRef"; interactionId: string }
	| { type: "gap"; gapId: string }

export type InlineContent<E extends WidgetTypeTuple> = Array<InlineContentItem<E>>

export type BlockContentItem<E extends WidgetTypeTuple> =
	| { type: "paragraph"; content: InlineContent<E> }
	| { type: "codeBlock"; code: string }
	| { type: "unorderedList"; items: InlineContent<E>[] }
	| { type: "orderedList"; items: InlineContent<E>[] }
	| { type: "tableRich"; header: (InlineContent<E> | null)[][] | null; rows: (InlineContent<E> | null)[][] }
	| { type: "widgetRef"; widgetId: string; widgetType: E[number] }
	| { type: "interactionRef"; interactionId: string }

export type BlockContent<E extends WidgetTypeTuple> = Array<BlockContentItem<E>>
