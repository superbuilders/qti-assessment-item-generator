import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import type { CartridgeReader } from "@/cartridge/reader"

export function createDirReader(root: string): CartridgeReader {
	return {
		async readText(p: string) {
			return await fs.readFile(path.join(root, p), "utf8")
		},
		async readBytes(p: string) {
			return new Uint8Array(await fs.readFile(path.join(root, p)))
		},
		async exists(p: string) {
			const result = await errors.try(fs.stat(path.join(root, p)))
			return !result.error
		},
		async list(prefix = "") {
			const allFiles: string[] = []
			async function walk(currentDir: string): Promise<void> {
				const dirents = await fs.readdir(currentDir, { withFileTypes: true })
				for (const de of dirents) {
					const fullPath = path.join(currentDir, de.name)
					if (de.isDirectory()) {
						await walk(fullPath)
					} else if (de.isFile()) {
						allFiles.push(path.relative(root, fullPath))
					}
				}
			}
			await walk(path.join(root, prefix))
			return allFiles.map((p) => p.split(path.sep).join("/"))
		},
	}
}


