import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { AssessmentItemInput, BlockContent, FeedbackPlan } from "../compiler/schemas"

function isLeafNode(node: unknown): node is { content: BlockContent } {
	return (
		typeof node === "object" &&
		node !== null &&
		"content" in node &&
		typeof node.content === "object" &&
		Array.isArray(node.content)
	)
}

function walkAndFlatten(
	node: unknown,
	pathSegments: Array<{ responseIdentifier: string; key: string }>,
	feedbackPlan: FeedbackPlan,
	blocks: AssessmentItemInput["feedbackBlocks"]
): void {
	if (!node || typeof node !== "object") {
		logger.error("non-object node in feedback tree", { node, pathSegments })
		throw errors.new("feedback tree contains non-object node")
	}
	if (isLeafNode(node)) {
		if (pathSegments.length === 0) {
			logger.error("feedback leaf node found at root", { node })
			throw errors.new("feedback leaf node cannot be at the root")
		}

		const matchingCombo = feedbackPlan.combinations.find((combo) => {
			if (combo.path.length !== pathSegments.length) return false
			return combo.path.every(
				(seg, i) => seg.responseIdentifier === pathSegments[i].responseIdentifier && seg.key === pathSegments[i].key
			)
		})
		if (!matchingCombo) {
			logger.error("no combination found for path during conversion", { pathSegments })
			throw errors.new("no combination found for path")
		}
		blocks[matchingCombo.id] = node.content
		return
	}

	for (const [responseId, children] of Object.entries(node)) {
		for (const [key, childNode] of Object.entries(children)) {
			const newPathSegments = [...pathSegments, { responseIdentifier: responseId, key }]
			walkAndFlatten(childNode, newPathSegments, feedbackPlan, blocks)
		}
	}
}

/**
 * Converts the AI's structured, nested feedback object into a map of feedback blocks
 * required by the compiler schema. Uses the feedbackPlan to map paths to identifiers.
 */
export function convertNestedFeedbackToBlocks(
	nestedFeedback: unknown,
	feedbackPlan: FeedbackPlan
): AssessmentItemInput["feedbackBlocks"] {
	if (!nestedFeedback || typeof nestedFeedback !== "object" || !("FEEDBACK__OVERALL" in nestedFeedback)) {
		logger.error("feedback missing FEEDBACK__OVERALL", { nestedFeedback })
		throw errors.new("feedback must contain FEEDBACK__OVERALL")
	}

	const blocks: AssessmentItemInput["feedbackBlocks"] = {}
	const overallFeedback = nestedFeedback.FEEDBACK__OVERALL

	if (!overallFeedback || typeof overallFeedback !== "object") {
		logger.error("FEEDBACK__OVERALL is not an object", { overallFeedback })
		throw errors.new("FEEDBACK__OVERALL must be an object")
	}

	if ("CORRECT" in overallFeedback) {
		const correctNode = overallFeedback.CORRECT
		if (correctNode && typeof correctNode === "object" && isLeafNode(correctNode)) {
			blocks.CORRECT = correctNode.content
		}
		if ("INCORRECT" in overallFeedback) {
			const incorrectNode = overallFeedback.INCORRECT
			if (incorrectNode && typeof incorrectNode === "object" && isLeafNode(incorrectNode)) {
				blocks.INCORRECT = incorrectNode.content
			}
		}
		if (Object.keys(blocks).length === 2) {
			return blocks
		}
	}

	walkAndFlatten(overallFeedback, [], feedbackPlan, blocks)
	return blocks
}
