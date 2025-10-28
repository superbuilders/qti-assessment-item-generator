import type { MiddlewareHandler } from "hono"
import { env } from "../env"

export type AppBindings = typeof env

/**
 * Placeholder bindings middleware. Extend once we know which env vars must be
 * exposed to request handlers and Inngest steps.
 */
export const bindings = (): MiddlewareHandler<{ Bindings: AppBindings }> => {
	return async (c, next) => {
		c.env = env
		await next()
	}
}
