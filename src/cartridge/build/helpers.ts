import * as fs from "node:fs/promises"
import * as path from "node:path"
import { createHash } from "node:crypto"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"

export function toPosixRel(rootDir: string, absPath: string): string {
	const rel = path.relative(rootDir, absPath)
	return rel.split(path.sep).join("/").replace(/^\.\/?/, "")
}

export async function writeJsonStrict(filePath: string, data: unknown): Promise<void> {
	const dir = path.dirname(filePath)
	const mk = await errors.try(fs.mkdir(dir, { recursive: true }))
	if (mk.error) {
		logger.error("directory creation", { dir, error: mk.error })
		throw errors.wrap(mk.error, "directory creation")
	}
	const content = JSON.stringify(data, null, 2) + "\n"
	const wr = await errors.try(fs.writeFile(filePath, content, "utf8"))
	if (wr.error) {
		logger.error("file write", { file: filePath, error: wr.error })
		throw errors.wrap(wr.error, "file write")
	}
}

export type IntegrityEntry = { size: number; sha256: string }
export type IntegrityManifest = { algorithm: "sha256"; files: Record<string, IntegrityEntry> }

export async function computeIntegrityManifest(rootDir: string): Promise<IntegrityManifest> {
	const files: Record<string, IntegrityEntry> = {}
	async function walk(dir: string): Promise<void> {
		const rd = await errors.try(fs.readdir(dir, { withFileTypes: true }))
		if (rd.error) {
			logger.error("directory read", { dir, error: rd.error })
			throw errors.wrap(rd.error, "directory read")
		}
		for (const de of rd.data) {
			const abs = path.join(dir, de.name)
			if (de.isDirectory()) {
				await walk(abs)
				continue
			}
			if (!de.isFile()) continue
			const rel = toPosixRel(rootDir, abs)
			const st = await errors.try(fs.stat(abs))
			if (st.error) {
				logger.error("file stat", { file: abs, error: st.error })
				throw errors.wrap(st.error, "file stat")
			}
			const rdFile = await errors.try(fs.readFile(abs))
			if (rdFile.error) {
				logger.error("file read", { file: abs, error: rdFile.error })
				throw errors.wrap(rdFile.error, "file read")
			}
			const hash = createHash("sha256").update(rdFile.data).digest("hex")
			files[rel] = { size: st.data.size, sha256: hash }
		}
	}
	await walk(rootDir)
	return { algorithm: "sha256", files }
}

export async function createTarBz2(packageOutDir: string, outFile: string): Promise<void> {
	const proc = Bun.spawn({
		cmd: ["tar", "-cjf", outFile, "-C", packageOutDir, "."],
		stdout: "pipe",
		stderr: "pipe",
	})
	const waited = await errors.try(proc.exited)
	if (waited.error || proc.exitCode !== 0) {
		const stderrText = await new Response(proc.stderr).text()
		logger.error("tar bzip2 failed", { exitCode: proc.exitCode, stderr: stderrText })
		throw errors.new("tar bzip2 failure")
	}
	logger.debug("tar.bz2 archive created", { file: outFile })
}

