// Defines TypeScript-only types for core library contracts. No runtime parsing.

export interface AiContextEnvelope {
	context: string[] // non-empty by contract; callers are responsible for correctness
	imageUrls: string[]
}
