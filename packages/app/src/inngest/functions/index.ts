import { generateTemplateCandidate } from "./candidate/generation"
import { validateTemplateCandidate } from "./candidate/validation"
import { helloWorldFunction } from "./hello-world"
import { startTemplateGeneration } from "./template/generation"
import { scaffoldTemplateFunction } from "./template/scaffold"

export const functions = [
	scaffoldTemplateFunction,
	helloWorldFunction,
	startTemplateGeneration,
	generateTemplateCandidate,
	validateTemplateCandidate
]
