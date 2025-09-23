// -----------------------------------------------------------------------------
// 1. IMPORTS
// The template only imports what is absolutely necessary: Zod for defining its
// input shape, and the core types it needs to produce from your library.
// -----------------------------------------------------------------------------
import { z } from "zod";
import type { AssessmentItemInput } from "../../compiler/schemas";

// -----------------------------------------------------------------------------
// 2. FUNDAMENTAL DATA TYPE & TEMPLATE PROPS SCHEMA
// This section defines the public contract of the template. It is the only
// part a user of the template needs to know. In a real-world scenario,
// FractionSchema would likely live in a shared types file.
// -----------------------------------------------------------------------------

/**
 * Defines the structure for a simple fraction.
 */
export const FractionSchema = z.object({
  numerator: z.number().int().describe("The integer numerator of the fraction."),
  denominator: z.number().int().positive().describe("The positive integer denominator of the fraction."),
});
export type Fraction = z.infer<typeof FractionSchema>;

/**
 * Zod schema defining the inputs required by the Fraction Addition template.
 * It requires exactly two fractions.
 */
export const FractionAdditionTemplatePropsSchema = z.object({
  addend1: FractionSchema.describe("The first fraction in the addition problem."),
  addend2: FractionSchema.describe("The second fraction in the addition problem."),
});

// The TypeScript type for the template's input, inferred from the Zod schema.
export type FractionAdditionTemplateInput = z.input<typeof FractionAdditionTemplatePropsSchema>;

// -----------------------------------------------------------------------------
// 3. THE TEMPLATE GENERATOR FUNCTION
// This is the deterministic core of the template. It is a pure function that
// transforms the input props into a valid AssessmentItemInput object.
// -----------------------------------------------------------------------------

/**
 * Generates the AssessmentItemInput data structure for a fraction addition question.
 *
 * @param props - An object containing the two fractions to be added.
 * @returns An AssessmentItemInput object ready for the QTI compiler.
 */
export function generateFractionAdditionQuestion(props: FractionAdditionTemplateInput): AssessmentItemInput {
  // --- 3a. Self-Contained Mathematical Helpers ---
  // To ensure the template is a pure, dependency-free module, all core
  // mathematical logic is implemented directly within its scope.

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const simplifyFraction = (frac: Fraction): Fraction => {
    const commonDivisor = gcd(frac.numerator, frac.denominator);
    return {
      numerator: frac.numerator / commonDivisor,
      denominator: frac.denominator / commonDivisor,
    };
  };

  const addFractions = (f1: Fraction, f2: Fraction): Fraction => {
    const commonDenominator = f1.denominator * f2.denominator;
    const newNumerator = f1.numerator * f2.denominator + f2.numerator * f1.denominator;
    return simplifyFraction({ numerator: newNumerator, denominator: commonDenominator });
  };
  
  const formatFractionMathML = (frac: Fraction): string => {
    return `<mfrac><mn>${frac.numerator}</mn><mn>${frac.denominator}</mn></mfrac>`;
  };

  // --- 3b. Core Logic: Calculate Answer and Pedagogically-Sound Distractors ---
  const { addend1, addend2 } = props;
  const correctAnswer = addFractions(addend1, addend2);

  // Distractors are generated based on common student misconceptions.
  // Each distractor is tagged with its error type for targeted feedback.
  const distractors: { fraction: Fraction; type: 'ADD_ACROSS' | 'ADD_NUM_COMMON_DEN' | 'CROSS_MULTIPLY' }[] = [
    {
      fraction: simplifyFraction({
        numerator: addend1.numerator + addend2.numerator,
        denominator: addend1.denominator + addend2.denominator,
      }),
      type: 'ADD_ACROSS',
    },
    {
      fraction: simplifyFraction({
        numerator: addend1.numerator + addend2.numerator,
        denominator: Math.max(addend1.denominator, addend2.denominator),
      }),
      type: 'ADD_NUM_COMMON_DEN',
    },
    {
        fraction: simplifyFraction({
            numerator: (addend1.numerator * addend2.denominator) + (addend2.numerator * addend1.denominator),
            denominator: addend1.denominator + addend2.denominator
        }),
        type: 'CROSS_MULTIPLY'
    }
  ];

  // --- 3c. Assemble and Deterministically Sort Choices ---
  const allChoices = [
    { fraction: correctAnswer, isCorrect: true, type: 'CORRECT' as const },
    ...distractors.map(d => ({ ...d, isCorrect: false })),
  ];
  
  // Filter out any distractors that happen to equal the correct answer.
  const uniqueChoices = allChoices.filter(
    (choice, index, self) =>
      index === self.findIndex((c) => c.fraction.numerator === choice.fraction.numerator && c.fraction.denominator === choice.fraction.denominator)
  );

  // Ensure exactly 4 choices for a consistent user experience.
  while (uniqueChoices.length < 4) {
    uniqueChoices.push({
      fraction: { numerator: uniqueChoices.length + correctAnswer.numerator, denominator: correctAnswer.denominator + uniqueChoices.length },
      isCorrect: false,
      type: 'CROSS_MULTIPLY' // Fallback type
    });
  }

  // Sort choices by their decimal value to ensure a deterministic, non-random order.
  const finalChoices = uniqueChoices.slice(0, 4).sort((a, b) => (a.fraction.numerator / a.fraction.denominator) - (b.fraction.numerator / b.fraction.denominator));

  const correctChoiceIndex = finalChoices.findIndex(c => c.isCorrect);

  // --- 3d. Construct the Final AssessmentItemInput Object ---
  const assessmentItem: AssessmentItemInput = {
    identifier: `fraction-addition-${addend1.numerator}-${addend1.denominator}-plus-${addend2.numerator}-${addend2.denominator}`,
    title: `Fraction Addition: ${addend1.numerator}/${addend1.denominator} + ${addend2.numerator}/${addend2.denominator}`,
    
    body: [
      {
        type: "paragraph",
        content: [
          { type: "text", content: "What is the sum of the fractions below? Give your answer in simplest form." },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "math",
            mathml: `${formatFractionMathML(addend1)}<mo>+</mo>${formatFractionMathML(addend2)}`,
          },
        ],
      },
      { type: "blockSlot", slotId: "sum_visual" },
      { type: "blockSlot", slotId: "choice_interaction" },
    ],
    
    widgets: {
      sum_visual: {
        type: "partitionedShape",
        width: 400,
        height: 300,
        mode: "partition",
        layout: "horizontal",
        overlays: [],
        shapes: [
          {
            type: "rectangle",
            totalParts: correctAnswer.denominator,
            shadedCells: Array.from({ length: correctAnswer.numerator }, (_, i) => i),
            hatchedCells: [],
            rows: 1,
            columns: correctAnswer.denominator,
            shadeColor: "#4CAF50B3",
            shadeOpacity: 0.7,
          },
        ],
      },
    },

    interactions: {
      choice_interaction: {
        type: "choiceInteraction",
        responseIdentifier: "RESPONSE",
        shuffle: true, // Always shuffle choices to ensure fairness.
        minChoices: 1,
        maxChoices: 1,
        prompt: [{ type: "text", content: "Select the correct sum." }],
        choices: finalChoices.map((choice, index) => {
          let feedbackContent: { type: "text"; content: string; }[];
          switch (choice.type) {
            case 'CORRECT':
              feedbackContent = [{ type: "text" as const, content: "This is the correct sum. Excellent work!" }];
              break;
            case 'ADD_ACROSS':
              feedbackContent = [{ type: "text" as const, content: "This answer is found by adding the numerators and the denominators directly. Remember, to add fractions, you must first find a common denominator." }];
              break;
            case 'ADD_NUM_COMMON_DEN':
              feedbackContent = [{ type: "text" as const, content: "It looks like you correctly added the numerators after finding a common denominator, but used one of the original denominators instead of the new common one." }];
              break;
            case 'CROSS_MULTIPLY':
                feedbackContent = [{ type: "text" as const, content: "This answer often comes from a mistake in finding the common denominator or adding the numerators. Double-check your multiplication and addition steps." }];
                break;
          }
          return {
            identifier: `CHOICE_${index}`,
            content: [{ type: "paragraph" as const, content: [{ type: "math" as const, mathml: formatFractionMathML(choice.fraction) }] }],
            feedback: feedbackContent,
          };
        }),
      },
    },

    responseDeclarations: [
      {
        identifier: "RESPONSE",
        cardinality: "single",
        baseType: "identifier",
        correct: `CHOICE_${correctChoiceIndex}`,
      },
    ],

    feedback: {
      correct: [
        {
          type: "paragraph",
          content: [
            { type: "text", content: "Excellent! You correctly identified the sum." },
          ],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", content: "Here is the step-by-step solution: " },
                { type: "math", mathml: `${formatFractionMathML(addend1)}<mo>+</mo>${formatFractionMathML(addend2)}<mo>=</mo><mfrac><mn>${addend1.numerator * addend2.denominator}</mn><mn>${addend1.denominator * addend2.denominator}</mn></mfrac><mo>+</mo><mfrac><mn>${addend2.numerator * addend1.denominator}</mn><mn>${addend2.denominator * addend1.denominator}</mn></mfrac><mo>=</mo>${formatFractionMathML(correctAnswer)}`},
            ]
        }
      ],
      incorrect: [
        {
          type: "paragraph",
          content: [
            { type: "text", content: "Not quite. To add fractions, first find a common denominator. Then, convert each fraction to an equivalent fraction with that denominator. Finally, add the new numerators." },
          ],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", content: "For example: " },
                { type: "math", mathml: `${formatFractionMathML(addend1)}<mo>+</mo>${formatFractionMathML(addend2)}<mo>=</mo>${formatFractionMathML(correctAnswer)}`},
            ]
        }
      ],
    },
  };

  return assessmentItem;
}
