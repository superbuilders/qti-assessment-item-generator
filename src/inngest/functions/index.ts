import { executeTemplateCandidate } from "./candidate/execution"
import { generateTemplateCandidate } from "./candidate/generation"
import { validateTemplateCandidate } from "./candidate/validation"
import { helloWorldFunction } from "./hello-world"
import { executeTemplate } from "./template/execution"
import { startTemplateGeneration } from "./template/generation"
import { scaffoldTemplateFunction } from "./template/scaffold"

export const functions = [
	scaffoldTemplateFunction,
	helloWorldFunction,
	startTemplateGeneration,
	executeTemplate,
	generateTemplateCandidate,
	executeTemplateCandidate,
	validateTemplateCandidate
]
