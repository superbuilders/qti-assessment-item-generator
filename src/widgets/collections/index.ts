import { allWidgetsCollection } from "./all"
import { fourthGradeMathCollection } from "./fourth-grade-math"
import { scienceCollection } from "./science"
import { simpleVisualCollection } from "./simple-visual"
import { teksMath4Collection } from "./teks-math-4"

export const widgetCollections = {
	[allWidgetsCollection.name]: allWidgetsCollection,
	[scienceCollection.name]: scienceCollection,
	[simpleVisualCollection.name]: simpleVisualCollection,
	[fourthGradeMathCollection.name]: fourthGradeMathCollection,
	[teksMath4Collection.name]: teksMath4Collection
} as const

export type WidgetCollectionName = keyof typeof widgetCollections

export type { WidgetCollection } from "./types"
