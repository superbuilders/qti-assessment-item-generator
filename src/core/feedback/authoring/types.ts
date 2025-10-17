import type { FeedbackContent } from "@/core/content"
import type { FeedbackPlan } from "@/core/feedback/plan"

export type ResponseIdentifierLiteral<P extends FeedbackPlan> =
	P["dimensions"][number]["responseIdentifier"]

export type AuthoringNestedLeaf<
	E extends readonly string[] = readonly string[],
	ContentT = FeedbackContent<E>
> = {
	content: ContentT
}

export type AuthoringNestedNode<
	P extends FeedbackPlan,
	E extends readonly string[] = readonly string[],
	ContentT = FeedbackContent<E>
> = {
	[responseIdentifier: string]: {
		[key: string]: AuthoringNestedLeaf<E, ContentT> | AuthoringNestedNode<P, E, ContentT>
	}
}

export type AuthoringFeedbackOverall<
	P extends FeedbackPlan,
	E extends readonly string[] = readonly string[],
	ContentT = FeedbackContent<E>
> =
	| { CORRECT: AuthoringNestedLeaf<E, ContentT>; INCORRECT: AuthoringNestedLeaf<E, ContentT> }
	| AuthoringNestedNode<P, E, ContentT>

export type NestedFeedbackAuthoring<
	P extends FeedbackPlan,
	E extends readonly string[] = readonly string[],
	ContentT = FeedbackContent<E>
> = {
	feedback: { FEEDBACK__OVERALL: AuthoringFeedbackOverall<P, E, ContentT> }
}
