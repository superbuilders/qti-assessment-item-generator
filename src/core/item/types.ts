import type { BlockContent } from "@/core/content"
import type { FeedbackPlan } from "@/core/feedback"
import type { AnyInteraction } from "@/core/interactions"
import type { typedSchemas } from "@/widgets/registry"
import type { z } from "zod"

export type Widget = z.infer<(typeof typedSchemas)[keyof typeof typedSchemas]>

export type ResponseDeclaration =
	| {
			identifier: string
			cardinality: "single" | "multiple" | "ordered"
			baseType: "string" | "integer" | "float"
			correct: string | number
	  }
	| {
			identifier: string
			cardinality: "single" | "multiple" | "ordered"
			baseType: "identifier"
			correct: string | string[]
	  }
	| {
			identifier: string
			cardinality: "multiple" | "ordered"
			baseType: "directedPair"
			correct: Array<{ source: string; target: string }>
			allowEmpty: boolean
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
	feedbackBlocks: Record<string, BlockContent<E>>
}

export type AssessmentItemInput<E extends readonly string[]> = AssessmentItem<E>
