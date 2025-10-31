import { PERSEUS_SVG_CACHE } from "@/testing/fixtures/perseus-svgs/cache"

export function createPrdMockFetch(): typeof fetch {
	const base = global.fetch

	const wrapped: typeof fetch = async (
		url: URL | RequestInfo,
		init?: RequestInit
	) => {
		const urlString = url.toString()

		// Simulated resolvers used in PRD examples
		if (urlString.includes("resolves-to.svg")) {
			if (init?.method === "HEAD") return new Response(null, { status: 200 })
			return new Response('<svg width="10" height="10"></svg>', { status: 200 })
		}
		// SVG HEAD ok but GET fails, should fall back to raster if available
		if (urlString.includes("svg-head-ok-get-fail.svg")) {
			if (init?.method === "HEAD") return new Response(null, { status: 200 })
			return new Response(null, { status: 404 })
		}
		if (urlString.includes("svg-head-ok-get-fail.png")) {
			if (init?.method === "HEAD") return new Response(null, { status: 200 })
			return new Response(null, { status: 404 })
		}
		if (urlString.includes("resolves-to.png")) {
			if (init?.method === "HEAD") return new Response(null, { status: 200 })
			return new Response(null, { status: 404 })
		}
		if (urlString.includes("resolves-to-jpg.jpg")) {
			if (init?.method === "HEAD") return new Response(null, { status: 200 })
			return new Response(null, { status: 404 })
		}
		if (urlString.includes("fails-to-resolve")) {
			return new Response(null, { status: 404 })
		}
		if (urlString.includes("times-out")) {
			await new Promise((resolve) => setTimeout(resolve, 50))
			return new Response(null, { status: 504 })
		}

		// HTML img SVGs
		if (urlString === "https://example.com/diagram.svg") {
			return new Response('<svg width="20" height="20"></svg>', { status: 200 })
		}
		if (urlString === "https://example.com/broken.svg") {
			return new Response(null, { status: 404 })
		}
		// Any example.com .svg (case-insensitive), with optional querystring, except broken.svg handled above
		if (/^https:\/\/example\.com\/[^\s]+\.svg(\?.*)?$/i.test(urlString)) {
			return new Response('<svg width="24" height="24"></svg>', { status: 200 })
		}

		// Allow direct KA images SVGs to succeed for unit tests
		if (
			/^https:\/\/cdn\.kastatic\.org\/ka-perseus-images\/.+\.svg$/i.test(
				urlString
			)
		) {
			return new Response('<svg width="42" height="42"></svg>', { status: 200 })
		}

		// Serve cached Perseus SVGs when requested directly
		const asGraphieProtocol = urlString.replace("https://", "web+graphie://")
		if (PERSEUS_SVG_CACHE[asGraphieProtocol]) {
			return new Response(PERSEUS_SVG_CACHE[asGraphieProtocol], { status: 200 })
		}

		return new Response(null, { status: 404 })
	}

	wrapped.preconnect = base.preconnect
	return wrapped
}

export function createAlwaysFailFetch(): typeof fetch {
	const base = global.fetch
	const wrapped: typeof fetch = async () => new Response(null, { status: 404 })
	wrapped.preconnect = base.preconnect
	return wrapped
}
