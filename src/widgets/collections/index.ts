import { allWidgetsCollection } from "./all"
import { fourthGradeMathCollection } from "./fourth-grade-math"
import { scienceCollection } from "./science"
import { simpleVisualCollection } from "./simple-visual"
import { teksMath4Collection } from "./teks-math-4"

export const widgetCollections: {
	readonly all: typeof allWidgetsCollection
	readonly science: typeof scienceCollection
	readonly "simple-visual": typeof simpleVisualCollection
	readonly "fourth-grade-math": typeof fourthGradeMathCollection
	readonly "teks-math-4": typeof teksMath4Collection
} = {
	all: allWidgetsCollection,
	science: scienceCollection,
	"simple-visual": simpleVisualCollection,
	"fourth-grade-math": fourthGradeMathCollection,
	"teks-math-4": teksMath4Collection
}

export type { WidgetCollection } from "./types"
