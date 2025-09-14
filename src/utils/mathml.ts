// Validates MathML INNER content: requires at least one tag, but MUST NOT be a full <math>...</math> wrapper.
// Constraints:
// - String must contain at least one '<...>' tag
// - Must NOT start with <math ...>
// - Must NOT end with </math>
// - Whitespace allowed around
export const MATHML_INNER_PATTERN = /^\s*(?!<\s*math\b)(?![\s\S]*<\/\s*math>\s*$)[\s\S]*<[^>]+>[\s\S]*>\s*$/
