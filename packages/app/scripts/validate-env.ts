#!/usr/bin/env bun

import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"

const validationResult = await errors.try(import("../src/env"))
if (validationResult.error) {
	logger.error("environment validation failed", {
		error: validationResult.error
	})
	process.exit(1)
}
