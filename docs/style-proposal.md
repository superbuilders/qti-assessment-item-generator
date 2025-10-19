Absolutely. That's a much cleaner, more modern approach that avoids polluting the global scope with a `<style>` tag and keeps the final output as a self-contained `<article>`.

Here is a revised, comprehensive proposal to refactor the styling mechanism to use a "CSS-in-JSON" object that compiles down to inline styles on the appropriate HTML tags.

### Proposal: Inject Inline Styles via a "CSS-in-JSON" Configuration

The new approach involves passing a structured JavaScript object to the build function. This object will map CSS selectors (like tag names) to style objects. A new "styler" module will traverse the DOM, find elements matching the selectors, and apply the corresponding styles directly to each element's `style` attribute.

---

### 1. Update Type Definitions in `types.ts`

First, let's define the shape of our style configuration object in `types.ts` and update the main options interface.

**File:** `types.ts`
```typescript
export type StyleRules = Record<string, string | number>
export type StyleObject = Record<string, StyleRules>

export interface StimulusOptions {
	removeSelectors?: string[]
	strict?: boolean
	inlineStyles?: StyleObject // Replace customStyles with this
}
```
*   **`StyleRules`**: Represents a set of CSS properties, like `{ color: "#333", lineHeight: 1.6 }`. We'll support camelCase keys, just like in React.
*   **`StyleObject`**: Maps a selector string (e.g., `"h2"`, `"p"`, `"strong"`) to its `StyleRules`.
*   **`StimulusOptions`**: We replace `customStyles` with the new, more specific `inlineStyles`.

---

### 2. Keep Sanitization Strict

We should continue stripping **all** inbound `style` attributes. Treat the styler as a pure post-processor: sanitize first, normalize the structure, then apply our trusted inline styles. This keeps untrusted Canvas CSS from slipping through while still letting us add our own rules later in the pipeline.

Because styles are re-applied after sanitization, no changes to the existing allowlists are needed.

---

### 3. Create the Inline Styler Module

This new module will contain the logic for converting the style object into inline `style` attributes and applying them to the DOM.

**New File:** `styler.ts`
```typescript
import type { StimulusOptions, StyleRules } from "@/stimulus/types"
import { isElementNode } from "@/stimulus/dom-utils"

/**
 * Converts a camelCased CSS property name to its kebab-cased equivalent.
 * Example: 'fontSize' => 'font-size'
 */
function camelToKebabCase(property: string): string {
	return property.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase()
}

/**
 * Converts a style rule object into a CSS string.
 * Example: { color: 'red', fontSize: '16px' } => 'color: red; font-size: 16px;'
 */
function styleRulesToCssString(rules: StyleRules): string {
	return Object.entries(rules)
		.map(([prop, value]) => {
			// Ensure unitless numbers for specific properties get 'px', or handle as is
			const finalValue =
				typeof value === "number" && !isUnitlessProperty(prop)
					? `${value}px`
					: value
			return `${camelToKebabCase(prop)}: ${finalValue};`
		})
		.join(" ")
}

// A helper to identify properties that don't need units
const unitlessProperties = new Set(['opacity', 'fontWeight', 'lineHeight', 'zIndex'])
function isUnitlessProperty(prop: string): boolean {
    return unitlessProperties.has(prop)
}

/**
 * Applies inline styles to elements in the document based on the provided style object.
 */
export function applyInlineStyles(root: Element, options?: StimulusOptions): void {
	const styles = options?.inlineStyles
	if (!styles) {
		return
	}

	for (const [selector, rules] of Object.entries(styles)) {
		const elements = root.querySelectorAll(selector)
		if (elements.length === 0) continue

		const cssString = styleRulesToCssString(rules)

		for (const element of Array.from(elements)) {
			if (isElementNode(element)) {
				const existingStyle = element.getAttribute("style") ?? ""
				const trimmed = existingStyle.trim()
				const separator =
					trimmed.length > 0 && !trimmed.endsWith(";") ? "; " : ""
				const merged = `${trimmed}${separator}${cssString}`.trim()
				element.setAttribute("style", merged)
			}
		}
	}
}
```

This module does three things:
1.  **`applyInlineStyles`**: The main function that iterates through the selectors in your `inlineStyles` object.
2.  **`styleRulesToCssString`**: A helper that converts a React-style object (`{ fontSize: 16 }`) into a valid CSS string (`"font-size: 16px;"`).
3.  **`camelToKebabCase`**: A utility to handle CSS property name conversion.

Sanitization guarantees that elements arrive without inline styles, so this logic effectively just writes the curated rules, but it stays resilient if we ever seed defaults.

---

### 4. Integrate the Styler into the Build Process

Now, we'll call `applyInlineStyles` from `builder.ts`. The ideal moment is **after** normalization but **before** serialization. This ensures we are styling the final, cleaned structure of the HTML.

**File:** `builder.ts`
```typescript
import { collectAssets } from "@/stimulus/assets"
import { createDocument } from "@/stimulus/dom"
import { normalizeStructure } from "@/stimulus/normalizers"
import { sanitizeDocument } from "@/stimulus/sanitizers"
import { serializeArticle } from "@/stimulus/serializer"
import { applyInlineStyles } from "@/stimulus/styler" // Import the new function
import type {
	StimulusBuildResult,
	StimulusInput,
	StimulusIssue,
	StimulusOptions
} from "@/stimulus/types"
import { validateHtml } from "@/stimulus/validator"

// ... (keep existing exports)

export function buildStimulusFromHtml(
	input: StimulusInput,
	options?: StimulusOptions
): StimulusBuildResult {
	const issues: StimulusIssue[] = []
	const sourceDocument = createDocument(input.html)
	sanitizeDocument(sourceDocument, issues, options)
	const article = normalizeStructure(sourceDocument, issues)

	// Apply styles after the DOM is clean and structured
	applyInlineStyles(article, options)

	const html = serializeArticle(article)
	const validationIssues = validateHtml(html)
	const assets = collectAssets(article)
	return {
		html,
		issues: [...issues, ...validationIssues],
		assets
	}
}

// ... (rest of the file remains the same)
```
This keeps styling as a final post-processing step: sanitized content stays clean, our curated rules land on the normalized `<article>`, and `serializeArticle` can emit a self-contained snippet without further changes.

---

### 5. Example Usage and Expected Output

Here’s how you would use the new system with a style object designed to beautify your content.

#### Example Style Object:

```typescript
const articleStyles = {
    "h2": {
        fontSize: "2em",
        borderBottom: "1px solid #eaecef",
        paddingBottom: "0.3em",
        marginTop: "24px",
        marginBottom: "16px",
        fontWeight: 600,
        lineHeight: 1.25
    },
    "h4": {
        fontSize: "1.5em",
        marginTop: "24px",
        marginBottom: "16px",
        fontWeight: 600,
        lineHeight: 1.25
    },
    "h5": {
        fontSize: "1.2em",
        marginTop: "24px",
        marginBottom: "16px",
        fontWeight: 600,
        lineHeight: 1.25,
        color: "#586069"
    },
    "p": {
        marginTop: 0,
        marginBottom: "16px",
        lineHeight: 1.6,
        color: "#24292e"
    },
    "strong": {
        fontWeight: 600
    },
    "ul, ol": {
        paddingLeft: "2em",
        marginBottom: "16px"
    }
};
```

#### Calling the Build Function:

```typescript
const result = buildStimulusFromHtml(
    { html: uglyHtml },
    { inlineStyles: articleStyles }
);

console.log(result.html);```

#### Expected HTML Output (Snippet):

```html
<article>
  <h2 style="font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25;">1.1 Plot Structure</h2>
  <div></div>
  <div>
    <div>
      <div>
        <p style="margin-top: 0; margin-bottom: 16px; line-height: 1.6; color: #24292e;">If you haven't done so already, download the <strong style="font-weight: 600;">Study Guide</strong> for unit 1, you can open it in Google Docs. Use the study guide to make notes; it will help you identify and practice the key concepts in the unit. The study guide is available as a <strong style="font-weight: 600;">PDF</strong> too.</p>
        <p style="margin-top: 0; margin-bottom: 16px; line-height: 1.6; color: #24292e;">Greetings from Silicon Valley High School! Welcome to English 9. This course is designed to make you a proficient reader, writer, and thinker at the high school level. We begin with the short story...</p>
        <h4 style="font-size: 1.5em; margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25;">The Short Story<br></h4>
        ...
      </div>
    </div>
  </div>
</article>
```

This revised proposal directly addresses your requirements, providing a robust, modern, and clean way to style your sanitized HTML content.
