import { isElementNode } from "@/stimulus/dom-utils"
import type {
	CssValue,
	StimulusOptions,
	StyleObject,
	StyleRules
} from "@/stimulus/types"

function camelToKebabCase(property: string): string {
	return property.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase()
}

const UNITLESS_PROPERTIES = new Set<string>([
	"opacity",
	"fontWeight",
	"lineHeight",
	"zIndex"
])

function isUnitlessProperty(property: string): boolean {
	return UNITLESS_PROPERTIES.has(property)
}

function ensureCssValue(property: string, value: unknown): CssValue {
	if (typeof value === "string") return value
	if (typeof value === "number") return value
	throw new Error(
		`Invalid CSS value for "${property}": only string or number values are supported`
	)
}

function styleRulesToCssString(rules: StyleRules): string {
	const declarations: string[] = []
	const keys = Object.keys(rules) as Array<keyof StyleRules>
	for (const key of keys) {
		const property = String(key)
		const rawValue = rules[key]
		if (rawValue === undefined) {
			throw new Error(`Inline style property "${property}" is undefined`)
		}
		const cssValue = ensureCssValue(property, rawValue)
		const kebabProperty = camelToKebabCase(property)
		let finalValue: string
		if (typeof cssValue === "number") {
			if (Number.isNaN(cssValue)) {
				throw new Error(
					`Invalid CSS value for "${property}": NaN is not allowed`
				)
			}
			finalValue = isUnitlessProperty(property)
				? String(cssValue)
				: `${cssValue}px`
		} else {
			finalValue = cssValue
		}
		declarations.push(`${kebabProperty}: ${finalValue};`)
	}
	return declarations.join(" ")
}

export function applyInlineStyles(
	root: Element,
	options?: StimulusOptions
): void {
	if (!options) {
		return
	}

	const styles: StyleObject | undefined = options.inlineStyles
	if (!styles) {
		return
	}

	for (const [selector, rules] of Object.entries(styles)) {
		const cssString = styleRulesToCssString(rules)
		if (cssString.length === 0) {
			continue
		}

		const elements = root.querySelectorAll(selector)
		if (elements.length === 0) {
			continue
		}

		for (const element of Array.from(elements)) {
			if (!isElementNode(element)) {
				continue
			}

			const existingAttribute = element.getAttribute("style")
			let nextStyle = cssString
			if (existingAttribute !== null) {
				const trimmed = existingAttribute.trim()
				if (trimmed.length > 0) {
					if (trimmed.endsWith(";")) {
						nextStyle = `${trimmed} ${cssString}`
					} else {
						nextStyle = `${trimmed}; ${cssString}`
					}
				}
			}

			element.setAttribute("style", nextStyle.trim())
		}
	}
}
