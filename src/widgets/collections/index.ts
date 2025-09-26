import { fourthGradeMathCollection } from "./fourth-grade-math"
import { mathCoreCollection } from "./math-core"
import { scienceCollection } from "./science"
import { simpleVisualCollection } from "./simple-visual"
import { teksMath4Collection } from "./teks-math-4"

export const widgetCollections = {
	[mathCoreCollection.name]: mathCoreCollection,
	[scienceCollection.name]: scienceCollection,
	[simpleVisualCollection.name]: simpleVisualCollection,
	[fourthGradeMathCollection.name]: fourthGradeMathCollection,
	[teksMath4Collection.name]: teksMath4Collection
} as const

export type WidgetCollectionName = keyof typeof widgetCollections
