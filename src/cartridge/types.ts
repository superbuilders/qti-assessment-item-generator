export type ResourceArticle = { id: string; type: "article"; path: string }
export type QuestionRef = { number: number; xml: string; json: string }
export type ResourceQuiz = {
	id: string
	type: "quiz"
	path: string
	questionCount: number
	questions: QuestionRef[]
}
export type Resource = ResourceArticle | ResourceQuiz

export type Lesson = {
	id: string
	unitId: string
	lessonNumber?: number
	title?: string
	resources: Array<ResourceArticle | ResourceQuiz>
}

export type UnitTest = { id: string; path: string; questionCount: number; questions: QuestionRef[] }

export type Unit = {
	id: string
	unitNumber?: number
	title?: string
	lessons: Array<{ id: string; title?: string; path: string }>
	unitTest?: UnitTest
	counts?: { lessonCount: number; resourceCount: number; questionCount: number }
}

export type IndexV1 = {
	version: 1
	generatedAt: string
	generator?: { name: string; version: string; commit?: string }
	units: Array<{ id: string; unitNumber?: number; title?: string; path: string }>
}

export type IntegrityEntry = { size: number; sha256: string }
export type IntegrityManifest = { algorithm: "sha256"; files: Record<string, IntegrityEntry> }
