import type { z } from "zod"
import type { BlockContent } from "@/core/content"
import type { AuthoringFeedbackOverall, FeedbackPlan } from "@/core/feedback"
import type { AnyInteraction } from "@/core/interactions"
import type { typedSchemas } from "@/widgets/registry"

export type Widget = z.infer<(typeof typedSchemas)[keyof typeof typedSchemas]>

export type DecimalPlacesRounding = {
	strategy: "decimalPlaces"
	figures: number
}

export type SignificantFiguresRounding = {
	strategy: "significantFigures"
	figures: number
}

export type NumericRounding = DecimalPlacesRounding | SignificantFiguresRounding

export type ResponseDeclaration =
	| {
			identifier: string
			cardinality: "single"
			baseType: "string"
			correct: string
	  }
	| {
			identifier: string
			cardinality: "single"
			baseType: "integer"
			correct: number
	  }
	| {
			identifier: string
			cardinality: "single"
			baseType: "float"
			correct: number
			rounding: NumericRounding
	  }
	| {
			identifier: string
			cardinality: "single"
			baseType: "identifier"
			correct: string
	  }
	| {
			identifier: string
			cardinality: "multiple" | "ordered"
			baseType: "identifier"
			correct: string[]
	  }
	| {
			identifier: string
			cardinality: "multiple"
			baseType: "directedPair"
			correct: Array<{ source: string; target: string }>
			allowEmpty: boolean
	  }
	| {
			identifier: string
			cardinality: "ordered"
			baseType: "directedPair"
			correct: Array<{ source: string; target: string }>
			allowEmpty: false
	  }

export type AssessmentItemShell<E extends readonly string[]> = {
	identifier: string
	title: string
	responseDeclarations: ResponseDeclaration[]
	body: BlockContent<E> | null
}

export type AssessmentItem<E extends readonly string[]> = {
	identifier: string
	title: string
	responseDeclarations: ResponseDeclaration[]
	body: BlockContent<E> | null
	widgets: Record<string, Widget> | null
	interactions: Record<string, AnyInteraction<E>> | null
	feedbackPlan: FeedbackPlan
	feedback: {
		FEEDBACK__OVERALL: AuthoringFeedbackOverall<FeedbackPlan, E>
	}
}

export type AssessmentItemInput<E extends readonly string[]> = AssessmentItem<E>
