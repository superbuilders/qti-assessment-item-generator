// Defines TypeScript-only types for core library contracts. No runtime parsing.

export interface AiContextEnvelope {
	context: string[] // [0] = primary source (Perseus JSON or HTML). Subsequent entries are SVG texts.
	rasterImageUrls: string[] // http/https URLs for raster images (png/jpeg/gif)
	vectorImageUrls: string[] // http/https URLs for vector images (svg)
}
