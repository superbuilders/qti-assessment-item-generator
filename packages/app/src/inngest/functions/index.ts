import { authoredAssessmentItemUpsertRequestedFunction } from "./authored-assessment-item-upsert"
import { templateGenerationRequestedFunction } from "./template-generation"
import { helloWorldFunction } from "./hello-world"

export const functions = [
	authoredAssessmentItemUpsertRequestedFunction,
	templateGenerationRequestedFunction,
	helloWorldFunction
]
