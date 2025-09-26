export interface AiContextEnvelope {
	primaryContent: string
	supplementaryContent: string[]
	multimodalImageUrls: string[]
	multimodalImagePayloads: RasterImagePayload[]
}

export interface RasterImagePayload {
	data: Blob
	mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"
}

export interface ImageContext {
	imageUrls: string[]
}
