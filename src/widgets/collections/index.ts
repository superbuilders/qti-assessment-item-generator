import { fourthGradeMathCollection } from "./fourth-grade-math"
import { mathCoreCollection } from "./math-core"
import { scienceCollection } from "./science"
import { simpleVisualCollection } from "./simple-visual"

export const widgetCollections = {
	[mathCoreCollection.name]: mathCoreCollection,
	[scienceCollection.name]: scienceCollection,
	[simpleVisualCollection.name]: simpleVisualCollection,
	[fourthGradeMathCollection.name]: fourthGradeMathCollection
} as const

export type WidgetCollectionName = keyof typeof widgetCollections
