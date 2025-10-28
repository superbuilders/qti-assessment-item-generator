import type { MiddlewareHandler } from "hono"

export type AppBindings = {
	DATABASE_URL?: string
	OPENAI_API_KEY?: string
	INNGEST_EVENT_KEY?: string
}

/**
 * Placeholder bindings middleware. Extend once we know which env vars must be
 * exposed to request handlers and Inngest steps.
 */
export const bindings = (): MiddlewareHandler<{ Bindings: AppBindings }> => {
	return async (_c, next) => {
		await next()
	}
}
