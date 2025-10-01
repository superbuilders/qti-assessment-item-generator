import type { BlockContent } from "@core/content"
import type { WidgetTypeTuple } from "@widgets/collections/types"
import type { FeedbackPlan } from "../plan"

export type ResponseIdentifierLiteral<P extends FeedbackPlan> = P["dimensions"][number]["responseIdentifier"]

export type AuthoringNestedLeaf<E extends WidgetTypeTuple = WidgetTypeTuple, ContentT = BlockContent<E>> = {
	content: ContentT
}

export type AuthoringNestedNode<P extends FeedbackPlan, E extends WidgetTypeTuple = WidgetTypeTuple, ContentT = BlockContent<E>> = {
	[responseIdentifier: string]: {
		[key: string]: AuthoringNestedLeaf<E, ContentT> | AuthoringNestedNode<P, E, ContentT>
	}
}

export type AuthoringFeedbackOverall<P extends FeedbackPlan, E extends WidgetTypeTuple = WidgetTypeTuple, ContentT = BlockContent<E>> =
	| { CORRECT: AuthoringNestedLeaf<E, ContentT>; INCORRECT: AuthoringNestedLeaf<E, ContentT> }
	| AuthoringNestedNode<P, E, ContentT>

export type NestedFeedbackAuthoring<P extends FeedbackPlan, E extends WidgetTypeTuple = WidgetTypeTuple, ContentT = BlockContent<E>> = {
	feedback: { FEEDBACK__OVERALL: AuthoringFeedbackOverall<P, E, ContentT> }
}
