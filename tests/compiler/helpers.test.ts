import { describe, expect, test } from "bun:test"
import { deriveComboIdentifier, normalizeIdPart } from "../../src/compiler/utils/helpers"

describe("helpers", () => {
	test("normalizeIdPart uppercases and strips invalids", () => {
		expect(normalizeIdPart("response_1")).toBe("RESPONSE_1")
		expect(normalizeIdPart("Res-1 A")).toBe("RES_1_A")
	})

	test("deriveComboIdentifier joins parts with FB__ prefix", () => {
		expect(deriveComboIdentifier(["RESPONSE_1_A"]).startsWith("FB__")).toBe(true)
		expect(deriveComboIdentifier(["RESPONSE_1_A"]))
			.toBe("FB__RESPONSE_1_A")
		expect(deriveComboIdentifier(["RESPONSE_1_A", "RESPONSE_2_CORRECT"]))
			.toBe("FB__RESPONSE_1_A__RESPONSE_2_CORRECT")
	})
})


