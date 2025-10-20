#!/usr/bin/env bun

import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import {
	iterUnitLessons,
	iterUnits,
	readArticleContent,
	readIndex,
	readQuestionJson,
	readQuestionXml,
	readVideoMetadata,
	validateIntegrity
} from "@/cartridge/client"
import { openCartridgeTarZst } from "@/cartridge/readers/tarzst"

logger.setDefaultLogLevel(logger.INFO)
logger.info("cartridge verifier started")

const filePath = process.argv[2]
if (!filePath) {
	logger.error("cartridge file path not provided")
	throw errors.new("cartridge file path must be provided as first argument")
}

const absolutePath = path.resolve(process.cwd(), filePath)
logger.info("verifying cartridge", { file: absolutePath })

async function main() {
	const ext = path.extname(absolutePath)
	if (ext !== ".zst") {
		logger.error("unsupported cartridge format, only .tar.zst supported", {
			extension: ext
		})
		throw errors.new("unsupported cartridge format")
	}

	const startOpen = performance.now()
	const reader = await openCartridgeTarZst(absolutePath)
	const openMs = performance.now() - startOpen
	logger.info("cartridge opened", { durationMs: openMs.toFixed(2) })

	const startIntegrity = performance.now()
	const validation = await validateIntegrity(reader)
	const integrityMs = performance.now() - startIntegrity
	if (!validation.ok) {
		logger.error("integrity validation failed", {
			issueCount: validation.issues.length,
			issues: validation.issues
		})
		throw errors.new("integrity validation failed")
	}
	logger.info("integrity validated", { durationMs: integrityMs.toFixed(2) })

	const startTraversal = performance.now()
	const index = await readIndex(reader)
	logger.info("index read", {
		version: index.version,
		generator: index.generator,
		unitCount: index.units.length
	})

	let totalUnits = 0
	let totalLessons = 0
	let totalArticles = 0
	let totalVideos = 0
	let totalQuizzes = 0
	let totalQuestions = 0

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null
	}

	for await (const unit of iterUnits(reader)) {
		totalUnits++
		let unitLessons = 0
		let unitArticles = 0
		let unitVideos = 0
		let unitQuizzes = 0
		let unitQuestions = 0

		for await (const lesson of iterUnitLessons(reader, unit)) {
			unitLessons++
			totalLessons++
			let lessonArticles = 0
			let lessonVideos = 0
			let lessonQuizzes = 0
			let lessonQuestions = 0

			for (const resource of lesson.resources) {
				if (resource.type === "article") {
					lessonArticles++
					unitArticles++
					totalArticles++
					const content = await readArticleContent(reader, resource.path)
					logger.debug("article verified", {
						unitId: unit.id,
						lessonId: lesson.id,
						articleId: resource.id,
						path: resource.path,
						byteLength: content.length
					})
					if (content.includes("<iframe")) {
						logger.error("article contains iframe", {
							unitId: unit.id,
							lessonId: lesson.id,
							articleId: resource.id,
							path: resource.path
						})
						throw errors.new("article iframe detected")
					}
					const lowered = content.toLowerCase()
					if (lowered.includes("watch the following videos")) {
						logger.error("article contains instructional callout", {
							unitId: unit.id,
							lessonId: lesson.id,
							articleId: resource.id,
							path: resource.path
						})
						throw errors.new("article instructional callout detected")
					}
				} else if (resource.type === "quiz") {
					lessonQuizzes++
					unitQuizzes++
					totalQuizzes++
					for (const q of resource.questions) {
						lessonQuestions++
						unitQuestions++
						totalQuestions++
						const xml = await readQuestionXml(reader, q.xml)
						const jsonData = await readQuestionJson(reader, q.json)
						const jsonKeys =
							typeof jsonData === "object" && jsonData !== null
								? Object.keys(jsonData)
								: []
						logger.debug("question verified", {
							unitId: unit.id,
							lessonId: lesson.id,
							quizId: resource.id,
							questionNumber: q.number,
							xmlPath: q.xml,
							jsonPath: q.json,
							xmlLength: xml.length,
							jsonKeys
						})
					}
				} else if (resource.type === "video") {
					lessonVideos++
					unitVideos++
					totalVideos++
					const metadata = await readVideoMetadata(reader, resource)
					logger.debug("video resource verified", {
						unitId: unit.id,
						lessonId: lesson.id,
						videoId: resource.id,
						path: resource.path,
						youtubeId: resource.youtubeId,
						durationSeconds: resource.durationSeconds
					})
					if (!isRecord(metadata)) {
						logger.error("video metadata invalid", {
							unitId: unit.id,
							lessonId: lesson.id,
							videoId: resource.id,
							path: resource.path
						})
						throw errors.new("video metadata invalid")
					}
					const metaYoutubeId = metadata.youtubeId
					if (typeof metaYoutubeId !== "string") {
						logger.error("video metadata youtube missing", {
							unitId: unit.id,
							lessonId: lesson.id,
							videoId: resource.id,
							path: resource.path
						})
						throw errors.new("video metadata youtube missing")
					}
					if (metaYoutubeId !== resource.youtubeId) {
						logger.error("video metadata youtube mismatch", {
							unitId: unit.id,
							lessonId: lesson.id,
							videoId: resource.id,
							path: resource.path,
							metadataYoutubeId: metaYoutubeId,
							expectedYoutubeId: resource.youtubeId
						})
						throw errors.new("video metadata youtube mismatch")
					}
					const metaDescription = metadata.description
					if (
						typeof metaDescription !== "string" ||
						metaDescription.length === 0
					) {
						logger.error("video metadata description missing", {
							unitId: unit.id,
							lessonId: lesson.id,
							videoId: resource.id,
							path: resource.path
						})
						throw errors.new("video metadata description missing")
					}
				}
			}

			logger.info("lesson verified", {
				unitId: unit.id,
				lessonId: lesson.id,
				lessonNumber: lesson.lessonNumber,
				title: lesson.title,
				articleCount: lessonArticles,
				videoCount: lessonVideos,
				quizCount: lessonQuizzes,
				questionCount: lessonQuestions
			})
		}

		if (unit.unitTest) {
			unitQuestions += unit.unitTest.questionCount
			totalQuestions += unit.unitTest.questionCount
			for (const q of unit.unitTest.questions) {
				const xml = await readQuestionXml(reader, q.xml)
				const jsonData = await readQuestionJson(reader, q.json)
				const jsonKeys =
					typeof jsonData === "object" && jsonData !== null
						? Object.keys(jsonData)
						: []
				logger.debug("unit test question verified", {
					unitId: unit.id,
					questionNumber: q.number,
					xmlPath: q.xml,
					jsonPath: q.json,
					xmlLength: xml.length,
					jsonKeys
				})
			}
			logger.info("unit test verified", {
				unitId: unit.id,
				testId: unit.unitTest.id,
				questionCount: unit.unitTest.questionCount
			})
		}

		logger.info("unit verified", {
			unitId: unit.id,
			unitNumber: unit.unitNumber,
			title: unit.title,
			lessonCount: unitLessons,
			articleCount: unitArticles,
			videoCount: unitVideos,
			quizCount: unitQuizzes,
			questionCount: unitQuestions
		})
	}

	const traversalMs = performance.now() - startTraversal

	logger.info("cartridge verification complete", {
		totalUnits,
		totalLessons,
		totalArticles,
		totalVideos,
		totalQuizzes,
		totalQuestions,
		openMs: openMs.toFixed(2),
		integrityMs: integrityMs.toFixed(2),
		traversalMs: traversalMs.toFixed(2),
		totalMs: (openMs + integrityMs + traversalMs).toFixed(2)
	})
}

const result = await errors.try(main())
if (result.error) {
	logger.error("verification failed", { error: result.error })
	process.exit(1)
}
