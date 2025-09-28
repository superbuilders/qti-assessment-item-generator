import type { AssessmentItemInput } from "./compiler/schemas"

export const probabilityNotPurpleSpinner: AssessmentItemInput = {
	identifier: "probability-not-purple-spinner",
	title: "Probability of not purple on a spinner",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "string",
			// Using "3/4" allows compiler to generate decimal equivalents (0.75 and .75)
			correct: "3/4"
		}
	],
	widgets: {
		image_1: {
			type: "probabilitySpinner",
			title: null,
			width: 300,
			groups: [
				{
					color: "#28ae7b",
					count: 1,
					emoji: null
				},
				{
					color: "#6495ed",
					count: 1,
					emoji: null
				},
				{
					color: "#9d38bd",
					count: 1,
					emoji: null
				},
				{
					color: "#ff00af",
					count: 1,
					emoji: null
				}
			],
			height: 300,
			pointerAngle: 80
		},
		probability_visual_explanation: {
			type: "discreteObjectRatioDiagram",
			title: "Probability Visualization",
			width: 400,
			height: 300,
			objects: [
				{ count: 3, emoji: "✅" },
				{ count: 1, emoji: "❌" }
			]
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "You spin the spinner shown below once. The spinner has " },
				{ type: "math", mathml: "<mn>4</mn>" },
				{ type: "text", content: " equal sectors colored pink, purple, blue, and green." }
			]
		},
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "What is " },
				{ type: "math", mathml: "<mi>P</mi><mo>(</mo><mtext>not purple</mtext><mo>)</mo>" },
				{ type: "text", content: "?" }
			]
		},
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "If necessary, round your answer to " },
				{ type: "math", mathml: "<mn>2</mn>" },
				{ type: "text", content: " decimal places." }
			]
		},
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "Answer: " },
				{ type: "inlineInteractionRef", interactionId: "text_entry" }
			]
		},
		{
			type: "widgetRef",
			widgetId: "image_1"
		}
	],
	interactions: {
		text_entry: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE",
			expectedLength: 4
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly found that the probability of not landing on purple is " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mn>0.75</mn>" },
						{ type: "text", content: " (or " },
						{ type: "math", mathml: "<mn>75</mn><mo>%</mo>" },
						{ type: "text", content: ")." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You understood that \"not purple\" means any of the other " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " colors: pink, blue, or green. Since each sector is equally likely, we count favorable outcomes over total outcomes." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This is called complementary probability. Instead of finding P(purple) = " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " and then subtracting from " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ", you directly counted the " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " non-purple sectors!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Real-world connection: This same thinking applies to any situation where you want the opposite of an event - like the probability of NOT raining, or NOT getting a specific card from a deck." }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through this step by step! Probability questions can be tricky, but there's a clear method." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Count the total number of equally likely outcomes. The spinner has " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " equal sectors." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Count the favorable outcomes. \"Not purple\" means any sector except purple, so that's " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " sectors (pink, blue, and green)." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Calculate probability = " },
						{ type: "math", mathml: "<mfrac><mtext>favorable outcomes</mtext><mtext>total outcomes</mtext></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>4</mn></mfrac>" }
					]
				},
				{ type: "widgetRef", widgetId: "probability_visual_explanation" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Memory tip: When you see \"not\" in a probability question, count everything EXCEPT that outcome!" }
					]
				}
			]
		}
	]
}

export const linearModelEquationPrediction: AssessmentItemInput = {
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"Daniel wants to predict how far he can hike based on the time he spends on the hike. He collected some data on the time (in hours) and distance (in kilometers) of some of his previous hikes. A line was fit to the data to model the relationship."
				}
			]
		},
		{ type: "widgetRef", widgetId: "image_1" },
		{
			type: "paragraph",
			content: [{ type: "text", content: "Which of these linear equations best describes the given model?" }]
		},
		{ type: "interactionRef", interactionId: "choice_interaction" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "Based on this equation, estimate the distance Daniel can hike in " },
				{ type: "math", mathml: "<mn>6</mn>" },
				{ type: "text", content: " hours." }
			]
		},
		{ type: "paragraph", content: [{ type: "text", content: "Round your answer to the nearest tenth." }] },
		{
			type: "paragraph",
			content: [
				{ type: "inlineInteractionRef", interactionId: "text_entry" },
				{ type: "text", content: " km" }
			]
		}
	],
	title: "Select a linear model from a scatterplot and make a prediction",
	widgets: {
		image_1: {
			type: "scatterPlot",
			title: "Time vs distance model",
			width: 359,
			xAxis: { max: 10, min: 0, label: "Time (hours)", gridLines: true, tickInterval: 1 },
			yAxis: { max: 20, min: 0, label: "Distance (kilometers)", gridLines: true, tickInterval: 2 },
			height: 354,
			points: [
				{ x: 2, y: 5, label: "" },
				{ x: 2.75, y: 8, label: "" },
				{ x: 4, y: 9.5, label: "" },
				{ x: 7.25, y: 16, label: "" },
				{ x: 8.5, y: 18, label: "" }
			],
			lines: [
				{ type: "bestFit", method: "linear", label: "", style: { color: "#333333", strokeWidth: 2, dash: false } }
			]
		},
		slope_interpretation_visual: {
			type: "tapeDiagram",
			width: 400,
			height: 300,
			referenceUnitsTotal: null,
			topTape: {
				label: "Understanding Slope",
				unitsTotal: 10,
				extent: null,
				grid: { show: true },
				roundedCaps: null,
				fills: [
					{ 
						span: { by: "units", startUnit: 0, endUnit: 2 },
						style: { kind: "solid", fill: "#4285F4", fillOpacity: null },
						label: {
							text: "2 km/hour",
							placement: "inside"
						}
					}
				]
			},
			bottomTape: null,
			brackets: []
		},
		linear_prediction_visual: {
			type: "numberLine",
			width: 500,
			height: 300,
			orientation: "horizontal",
			min: 0,
			max: 15,
			tickInterval: { type: "whole", interval: 3 },
			secondaryTickInterval: null,
			showTickLabels: true,
			highlightedPoints: [
				{ type: "whole", position: 14, value: 14, sign: "+", color: "#4285F4", style: "dot" }
			],
			segments: null,
			model: null
		}
	},
	feedbackBlocks: [
		// Feedback for choice_interaction (per-choice)
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE_CHOICE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Outstanding! You correctly identified that a reasonable linear model fits the points with a slope of " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " and a y-intercept of " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ", giving us the equation " },
						{
							type: "math",
							mathml:
								'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1.5</mn></mrow>'
						},
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated excellent understanding of linear modeling! The slope of " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " means Daniel hikes approximately " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " kilometers for every hour, and the y-intercept of " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: " suggests he covers some initial distance even at time zero." }
					]
				},
				{ type: "widgetRef", widgetId: "slope_interpretation_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This type of linear modeling is used everywhere: predicting sales growth, calculating medication dosages over time, and even estimating how much fuel a car uses per mile!" }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE_CHOICE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Good thinking, but let's examine the slope more carefully! You identified the y-intercept correctly as " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ", which shows you understand where the line crosses the y-axis." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "To find the slope, pick " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " clear points on the line. For example, from " },
						{ type: "math", mathml: "<mo>(</mo><mn>0</mn><mo>,</mo><mn>1.5</mn><mo>)</mo>" },
						{ type: "text", content: " to " },
						{ type: "math", mathml: "<mo>(</mo><mn>4</mn><mo>,</mo><mn>9.5</mn><mo>)</mo>" },
						{ type: "text", content: ":" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Slope = " },
						{ type: "math", mathml: "<mfrac><mtext>rise</mtext><mtext>run</mtext></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mrow><mn>9.5</mn><mo>-</mo><mn>1.5</mn></mrow><mrow><mn>4</mn><mo>-</mo><mn>0</mn></mrow></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>8</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mn>2</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "So the correct equation is " },
						{ type: "math", mathml: "<mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1.5</mn>" },
						{ type: "text", content: ", not " },
						{ type: "math", mathml: "<mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>1</mn><mi>x</mi><mo>+</mo><mn>1.5</mn>" },
						{ type: "text", content: "." }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE_CHOICE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Great work on finding the slope as " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: "! You correctly calculated the rate of change. Now let's check the y-intercept together." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The y-intercept is where the line crosses the y-axis (when " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>0</mn>" },
						{ type: "text", content: "). Looking at the graph, the line appears to cross at " },
						{ type: "math", mathml: "<mo>(</mo><mn>0</mn><mo>,</mo><mn>1.5</mn><mo>)</mo>" },
						{ type: "text", content: ", not " },
						{ type: "math", mathml: "<mo>(</mo><mn>0</mn><mo>,</mo><mo>-</mo><mn>1.5</mn><mo>)</mo>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Remember: A positive y-intercept means the line starts above the x-axis, while a negative y-intercept means it starts below the x-axis." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The correct equation is " },
						{ type: "math", mathml: "<mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1.5</mn>" },
						{ type: "text", content: " (positive " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ", not negative)." }
					]
				}
			]
		},
		{
			identifier: "D",
			outcomeIdentifier: "FEEDBACK__RESPONSE_CHOICE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through finding both the slope and y-intercept systematically! Linear equations have the form " },
						{ type: "math", mathml: "<mi>y</mi><mo>=</mo><mi>m</mi><mi>x</mi><mo>+</mo><mi>b</mi>" },
						{ type: "text", content: " where " },
						{ type: "math", mathml: "<mi>m</mi>" },
						{ type: "text", content: " is slope and " },
						{ type: "math", mathml: "<mi>b</mi>" },
						{ type: "text", content: " is y-intercept." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Finding the y-intercept: Look where the line crosses the y-axis. This appears to be at " },
						{ type: "math", mathml: "<mo>(</mo><mn>0</mn><mo>,</mo><mn>1.5</mn><mo>)</mo>" },
						{ type: "text", content: ", so " },
						{ type: "math", mathml: "<mi>b</mi><mo>=</mo><mn>1.5</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Finding the slope: Pick " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " points and use " },
						{ type: "math", mathml: "<mi>m</mi><mo>=</mo><mfrac><mrow><mi>y</mi><mn>2</mn><mo>-</mo><mi>y</mi><mn>1</mn></mrow><mrow><mi>x</mi><mn>2</mn><mo>-</mo><mi>x</mi><mn>1</mn></mrow></mfrac>" },
						{ type: "text", content: ". Using points " },
						{ type: "math", mathml: "<mo>(</mo><mn>2</mn><mo>,</mo><mn>5</mn><mo>)</mo>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mo>(</mo><mn>4</mn><mo>,</mo><mn>9.5</mn><mo>)</mo>" },
						{ type: "text", content: ":" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Slope = " },
						{ type: "math", mathml: "<mfrac><mrow><mn>9.5</mn><mo>-</mo><mn>5</mn></mrow><mrow><mn>4</mn><mo>-</mo><mn>2</mn></mrow></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>4.5</mn><mn>2</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mn>2.25</mn>" },
						{ type: "text", content: " ≈ " },
						{ type: "math", mathml: "<mn>2</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Therefore, the equation is " },
						{ type: "math", mathml: "<mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1.5</mn>" },
						{ type: "text", content: "." }
					]
				}
			]
		},
		// Feedback for text_entry (CORRECT/INCORRECT)
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! You correctly used the model to predict that in " },
						{ type: "math", mathml: "<mn>6</mn>" },
						{ type: "text", content: " hours, Daniel can hike " },
						{ type: "math", mathml: "<mn>13.5</mn>" },
						{ type: "text", content: " kilometers." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Your calculation was spot-on: " },
						{
							type: "math",
							mathml:
								'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mo>(</mo><mn>6</mn><mo>)</mo><mo>+</mo><mn>1.5</mn><mo>=</mo><mn>12</mn><mo>+</mo><mn>1.5</mn><mo>=</mo><mn>13.5</mn></mrow>'
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated excellent understanding of how to use linear models for prediction! This skill is crucial for making informed decisions based on data patterns." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Challenge: If Daniel wanted to hike exactly " },
						{ type: "math", mathml: "<mn>20</mn>" },
						{ type: "text", content: " kilometers, how many hours would that take according to this model?" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through this prediction step by step! Using linear models to make predictions is a powerful skill once you get the process down." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": First, we need the correct linear equation. From the graph, we can estimate the slope from " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " clear points on the fitted line." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Using points " },
						{ type: "math", mathml: "<mo>(</mo><mn>0</mn><mo>,</mo><mn>1.5</mn><mo>)</mo>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mo>(</mo><mn>4</mn><mo>,</mo><mn>9.5</mn><mo>)</mo>" },
						{ type: "text", content: ", the slope is " },
						{
							type: "math",
							mathml:
								"<mrow><mfrac><mrow><mn>9.5</mn><mo>-</mo><mn>1.5</mn></mrow><mrow><mn>4</mn><mo>-</mo><mn>0</mn></mrow></mfrac><mo>=</mo><mfrac><mn>8</mn><mn>4</mn></mfrac><mo>=</mo><mn>2</mn></mrow>"
						}
					]
						},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The y-intercept is " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ", so our model is " },
						{
							type: "math",
							mathml:
								'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1.5</mn></mrow>'
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Substitute " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>6</mn>" },
						{ type: "text", content: " hours into the equation:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{
							type: "math",
							mathml: '<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mo>(</mo><mn>6</mn><mo>)</mo><mo>+</mo><mn>1.5</mn><mo>=</mo><mn>12</mn><mo>+</mo><mn>1.5</mn><mo>=</mo><mn>13.5</mn></mrow>'
						}
					]
				},
				{ type: "widgetRef", widgetId: "linear_prediction_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Therefore, Daniel can hike approximately " },
						{ type: "math", mathml: "<mn>13.5</mn>" },
						{ type: "text", content: " kilometers in " },
						{ type: "math", mathml: "<mn>6</mn>" },
						{ type: "text", content: " hours." }
					]
				}
			]
		}
	],
	identifier: "linear-model-equation-prediction",
	interactions: {
		text_entry: { type: "textEntryInteraction", expectedLength: null, responseIdentifier: "RESPONSE_TEXT" },
		choice_interaction: {
			type: "choiceInteraction",
			prompt: [],
			choices: [
				{
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "math",
									mathml:
										'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1.5</mn></mrow>'
								}
							]
						}
					],
					identifier: "A"
				},
				{
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "math",
									mathml:
										'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mi>x</mi><mo>+</mo><mn>1.5</mn></mrow>'
								}
							]
						}
					],
					identifier: "B"
				},
				{
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "math",
									mathml:
										'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>-</mo><mn>1.5</mn></mrow>'
								}
							]
						}
					],
					identifier: "C"
				},
				{
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "math",
									mathml:
										'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mi>x</mi><mo>-</mo><mn>1.5</mn></mrow>'
								}
							]
						}
					],
					identifier: "D"
				}
			],
			shuffle: true,
			maxChoices: 1,
			minChoices: 1,
			responseIdentifier: "RESPONSE_CHOICE"
		}
	},
	responseDeclarations: [
		{ correct: "A", baseType: "identifier", identifier: "RESPONSE_CHOICE", cardinality: "single" },
		{ correct: "27/2", baseType: "string", identifier: "RESPONSE_TEXT", cardinality: "single" }
	]
}

export const doubleNumberLineRatio: AssessmentItemInput = {
	identifier: "double-number-line-ratio",
	title: "Equivalent Ratios on a Double Number Line",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "A"
		}
	],
	widgets: {
		stimulus_dnl: {
			type: "doubleNumberLine",
			width: 400,
			height: 300,
			topLine: { label: "Distance, kilometers", ticks: [0, "", "", 3, ""] },
			bottomLine: { label: "Elevation, meters", ticks: [0, "", "", 120, ""] }
		},
		choice_a_dnl: {
			type: "doubleNumberLine",
			width: 400,
			height: 300,
			topLine: { label: "Distance, kilometers", ticks: [0, 1, 2, 3, 4] },
			bottomLine: { label: "Elevation, meters", ticks: [0, 40, 80, 120, 160] }
		},
		choice_b_dnl: {
			type: "doubleNumberLine",
			width: 400,
			height: 300,
			topLine: { label: "Distance, kilometers", ticks: [0, 1, 2, 3, 4] },
			bottomLine: { label: "Elevation, meters", ticks: [0, 80, 100, 120, 140] }
		},
		ratio_relationship_visual: {
			type: "tapeDiagram",
			width: 400,
			height: 300,
			referenceUnitsTotal: null,
			topTape: {
				label: "Ratio Visualization",
				unitsTotal: 40,
				extent: null,
				grid: { show: true },
				roundedCaps: null,
				fills: [
					{ 
						span: { by: "units", startUnit: 0, endUnit: 40 },
						style: { kind: "solid", fill: "#FF6B6B", fillOpacity: null },
						label: {
							text: "40m per 1km",
							placement: "inside"
						}
					}
				]
			},
			bottomTape: null,
			brackets: []
		},
		double_number_line_explanation: {
			type: "doubleNumberLine",
			width: 400,
			height: 300,
			topLine: { label: "Distance (km)", ticks: [0, 1, 2, 3, 4] },
			bottomLine: { label: "Elevation (m)", ticks: [0, 40, 80, 120, 160] }
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content: "Cory hikes up a hill with a constant slope. The double number line shows that after Cory hikes "
				},
				{ type: "math", mathml: "<mn>3</mn><mtext> km</mtext>" },
				{ type: "text", content: ", their elevation is " },
				{ type: "math", mathml: "<mn>120</mn><mtext> m</mtext>" },
				{ type: "text", content: "." }
			]
		},
		{ type: "widgetRef", widgetId: "stimulus_dnl" },
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			prompt: [
				{
					type: "text",
					content: "Select the double number line that shows the other values of distance and elevation."
				}
			],
			minChoices: 1,
			maxChoices: 1,
			shuffle: true,
			choices: [
				{
					identifier: "A",
					content: [{ type: "widgetRef", widgetId: "choice_a_dnl" }]
				},
				{
					identifier: "B",
					content: [{ type: "widgetRef", widgetId: "choice_b_dnl" }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly identified that the ratio of distance to elevation is " },
						{ type: "math", mathml: "<mn>3</mn><mo>:</mo><mn>120</mn>" },
						{ type: "text", content: ", which simplifies to a unit rate of " },
						{ type: "math", mathml: "<mn>1</mn><mo>:</mo><mn>40</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You understood that for every " },
						{ type: "math", mathml: "<mn>1</mn><mtext> km</mtext>" },
						{ type: "text", content: " Cory hikes horizontally, the elevation increases by " },
						{ type: "math", mathml: "<mn>40</mn><mtext> m</mtext>" },
						{ type: "text", content: ". This constant rate creates a proportional relationship!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Double number lines are perfect for showing these proportional relationships. Each tick mark maintains the same ratio, making it easy to find equivalent values." }
					]
				},
				{ type: "widgetRef", widgetId: "ratio_relationship_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Real-world application: This same thinking applies to currency exchange rates, recipe scaling, and speed calculations!" }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through this ratio problem together! Double number lines can be tricky, but there's a systematic approach." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Find the unit rate. We know that after hiking " },
						{ type: "math", mathml: "<mn>3</mn><mtext> km</mtext>" },
						{ type: "text", content: ", Cory's elevation is " },
						{ type: "math", mathml: "<mn>120</mn><mtext> m</mtext>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Rate = " },
						{
							type: "math",
							mathml:
								"<mfrac><mrow><mn>120</mn><mtext> m</mtext></mrow><mrow><mn>3</mn><mtext> km</mtext></mrow></mfrac><mo>=</mo><mn>40</mn><mtext> meters per kilometer</mtext>"
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Apply this rate to fill in the missing values. For every " },
						{ type: "math", mathml: "<mn>1</mn><mtext> km</mtext>" },
						{ type: "text", content: " of distance, add " },
						{ type: "math", mathml: "<mn>40</mn><mtext> m</mtext>" },
						{ type: "text", content: " of elevation:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mn>1</mn><mtext> km</mtext>" },
						{ type: "text", content: " → " },
						{ type: "math", mathml: "<mn>40</mn><mtext> m</mtext>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mn>2</mn><mtext> km</mtext>" },
						{ type: "text", content: " → " },
						{ type: "math", mathml: "<mn>80</mn><mtext> m</mtext>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mn>4</mn><mtext> km</mtext>" },
						{ type: "text", content: " → " },
						{ type: "math", mathml: "<mn>160</mn><mtext> m</mtext>" }
					]
				},
				{ type: "widgetRef", widgetId: "double_number_line_explanation" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Memory tip: In proportional relationships, if you know one complete ratio, you can find any other by scaling up or down!" }
					]
				}
			]
		}
	]
}

export const evalFractionalExponents: AssessmentItemInput = {
	identifier: "eval-fractional-exponents",
	title: "Evaluate an expression with negative fractional exponents",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "integer",
			correct: 81
		}
	],
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "Evaluate the expression and enter your answer: " },
				{ type: "inlineInteractionRef", interactionId: "text_entry" }
			]
		}
	],
	interactions: {
		text_entry: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE",
			expectedLength: 3
		}
	},
	widgets: {
		exponent_rules_visual: {
			type: "dataTable",
			title: "Exponent Rules Reference",
			columns: [
				{ key: "rule", label: [{ type: "text", content: "Rule" }], isNumeric: false },
				{ key: "example", label: [{ type: "text", content: "Example" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Quotient Rule" }] },
					{ type: "inline", content: [{ type: "text", content: "a^n / b^n = (a/b)^n" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Negative Exponent" }] },
					{ type: "inline", content: [{ type: "text", content: "a^(-n) = 1/a^n" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Fractional Exponent" }] },
					{ type: "inline", content: [{ type: "text", content: "a^(m/n) = nth root of a^m" }] }
				]
			],
			footer: []
		},
		fractional_exponent_steps_visual: {
			type: "tapeDiagram",
			width: 500,
			height: 300,
			referenceUnitsTotal: null,
			topTape: {
				label: "Step-by-Step Process",
				unitsTotal: 4,
				extent: null,
				grid: { show: true },
				roundedCaps: null,
				fills: [
					{ 
						span: { by: "units", startUnit: 0, endUnit: 1 },
						style: { kind: "solid", fill: "#FF6B6B", fillOpacity: null },
						label: {
							text: "Apply quotient rule",
							placement: "inside"
						}
					},
					{ 
						span: { by: "units", startUnit: 1, endUnit: 2 },
						style: { kind: "solid", fill: "#4285F4", fillOpacity: null },
						label: {
							text: "Simplify fraction",
							placement: "inside"
						}
					},
					{ 
						span: { by: "units", startUnit: 2, endUnit: 3 },
						style: { kind: "solid", fill: "#34A853", fillOpacity: null },
						label: {
							text: "Negative exponent",
							placement: "inside"
						}
					},
					{ 
						span: { by: "units", startUnit: 3, endUnit: 4 },
						style: { kind: "solid", fill: "#FBBC04", fillOpacity: null },
						label: {
							text: "Evaluate",
							placement: "inside"
						}
					}
				]
			},
			bottomTape: null,
			brackets: []
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Outstanding work! You correctly evaluated this complex expression and found the answer is 81." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You successfully applied the quotient rule for exponents and worked through the steps systematically." }
					]
				},
				{ type: "widgetRef", widgetId: "exponent_rules_visual" }
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This is a challenging problem! Let's work through it step by step using exponent rules." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step 1: Apply the quotient rule for exponents to simplify the expression." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step 2: Simplify the fraction inside the parentheses." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step 3: Apply the negative exponent rule." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step 4: Convert the fractional exponent to get the final answer of 81." }
					]
				},
				{ type: "widgetRef", widgetId: "fractional_exponent_steps_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Remember: Negative exponents flip fractions, and fractional exponents represent roots. Practice these rules - they're the foundation for advanced algebra!" }
					]
				}
			]
		}
	]
}

export const compare3DigitNumbers: AssessmentItemInput = {
	identifier: "compare-3-digit-numbers",
	title: "Compare 3-digit numbers",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "ordered",
			baseType: "identifier",
			correct: ["A", "B", "C"]
		},
		{
			identifier: "RESPONSE_TEXT_ENTRY",
			cardinality: "single",
			baseType: "string",
			correct: "correct"
		}
	],
	body: [{ type: "interactionRef", interactionId: "order_interaction" }],
	interactions: {
		order_interaction: {
			type: "orderInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			orientation: "vertical",
			prompt: [{ type: "text", content: "Arrange the cards to make a true comparison." }],
			choices: [
				{
					identifier: "A",
					content: [
						{
							type: "paragraph",
							content: [{ type: "math", mathml: "<mn>708</mn>" }]
						}
					]
				},
				{
					identifier: "B",
					content: [
						{
							type: "paragraph",
							content: [{ type: "math", mathml: "<mo>&gt;</mo>" }]
						}
					]
				},
				{
					identifier: "C",
					content: [
						{
							type: "paragraph",
							content: [{ type: "math", mathml: "<mn>79</mn>" }]
						}
					]
				}
			]
		},
		text_entry: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE_TEXT_ENTRY",
			expectedLength: 10
		}
	},
	widgets: {
		place_value_comparison_visual: {
			type: "dataTable",
			title: "Place Value Breakdown",
			columns: [
				{ key: "number", label: [{ type: "text", content: "Number" }], isNumeric: false },
				{ key: "hundreds", label: [{ type: "text", content: "Hundreds" }], isNumeric: true },
				{ key: "tens", label: [{ type: "text", content: "Tens" }], isNumeric: true },
				{ key: "ones", label: [{ type: "text", content: "Ones" }], isNumeric: true }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>708</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>7</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>0</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>8</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>79</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>0</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>7</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>9</mn>" }] }
				]
			],
			footer: []
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly arranged the cards as " },
						{ type: "math", mathml: "<mn>708</mn><mo>&gt;</mo><mn>79</mn>" },
						{ type: "text", content: ", which is a true comparison." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated solid understanding of place value! " },
						{ type: "math", mathml: "<mn>708</mn>" },
						{ type: "text", content: " has " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " hundreds, while " },
						{ type: "math", mathml: "<mn>79</mn>" },
						{ type: "text", content: " has only " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " tens, making " },
						{ type: "math", mathml: "<mn>708</mn>" },
						{ type: "text", content: " much larger." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The greater than symbol (>) always \"eats\" the smaller number - it opens toward the larger number!" }
					]
				},
				{ type: "widgetRef", widgetId: "place_value_comparison_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This place value thinking will help you compare any numbers, even very large ones with millions or billions!" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through comparing these numbers using place value! Comparing numbers is all about understanding which digits are most important." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Compare the hundreds place first. " },
						{ type: "math", mathml: "<mn>708</mn>" },
						{ type: "text", content: " has " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " hundreds, but " },
						{ type: "math", mathml: "<mn>79</mn>" },
						{ type: "text", content: " has " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " hundreds." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Since " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " hundreds > " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " hundreds, we know " },
						{ type: "math", mathml: "<mn>708</mn><mo>&gt;</mo><mn>79</mn>" },
						{ type: "text", content: " without even looking at the other digits!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Choose the correct symbol. Since " },
						{ type: "math", mathml: "<mn>708</mn>" },
						{ type: "text", content: " is larger, it goes on the left with the > symbol pointing toward the smaller number." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The correct arrangement is: " },
						{ type: "math", mathml: "<mn>708</mn>" },
						{ type: "text", content: " > " },
						{ type: "math", mathml: "<mn>79</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Memory trick: The > symbol is like a hungry mouth that always wants to \"eat\" the bigger number!" }
					]
				}
			]
		}
	]
}

export const inequalityNumberLine: AssessmentItemInput = {
	identifier: "inequality-number-line",
	title: "Identify an inequality from a number-line graph",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "C"
		}
	],
	widgets: {
		inequality_widget: {
			type: "inequalityNumberLine",
			width: 500,
			height: 300,
			min: -5,
			max: 5,
			tickInterval: 1,
			ranges: [
				{
					start: { type: "bounded", at: { value: 0, type: "open" } },
					end: { type: "unbounded" },
					color: "#4285F4"
				}
			]
		},
		inequality_direction_visual: {
			type: "numberLine",
			width: 400,
			height: 300,
			orientation: "horizontal",
			min: -2,
			max: 2,
			tickInterval: { type: "whole", interval: 1 },
			secondaryTickInterval: null,
			showTickLabels: true,
			highlightedPoints: [],
			segments: [
				{ start: -2, end: 0, color: "#FF6B6B" }
			],
			model: null
		},
		inequality_notation_visual: {
			type: "dataTable",
			title: "Inequality Symbols",
			columns: [
				{ key: "symbol", label: [{ type: "text", content: "Symbol" }], isNumeric: false },
				{ key: "meaning", label: [{ type: "text", content: "Meaning" }], isNumeric: false },
				{ key: "circle", label: [{ type: "text", content: "Circle Type" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mo>&gt;</mo>" }] },
					{ type: "inline", content: [{ type: "text", content: "greater than" }] },
					{ type: "inline", content: [{ type: "text", content: "open ○" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mo>≥</mo>" }] },
					{ type: "inline", content: [{ type: "text", content: "greater than or equal" }] },
					{ type: "inline", content: [{ type: "text", content: "closed ●" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{ type: "widgetRef", widgetId: "inequality_widget" },
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [{ type: "text", content: "Choose the inequality that represents the graph." }],
			choices: [
				{
					identifier: "A",
					content: [
						{
							type: "paragraph",
							content: [{ type: "math", mathml: "<mi>x</mi><mo>&lt;</mo><mn>0</mn>" }]
						}
					]
				},
				{
					identifier: "B",
					content: [
						{
							type: "paragraph",
							content: [{ type: "math", mathml: "<mi>x</mi><mo>≤</mo><mn>0</mn>" }]
						}
					]
				},
				{
					identifier: "C",
					content: [
						{
							type: "paragraph",
							content: [{ type: "math", mathml: "<mi>x</mi><mo>&gt;</mo><mn>0</mn>" }]
						}
					]
				},
				{
					identifier: "D",
					content: [
						{
							type: "paragraph",
							content: [{ type: "math", mathml: "<mi>x</mi><mo>≥</mo><mn>0</mn>" }]
						}
					]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "I can see why you might think this! Let's examine the direction of the shading on the number line more carefully." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The inequality " },
						{ type: "math", mathml: "<mi>x</mi><mo>&lt;</mo><mn>0</mn>" },
						{ type: "text", content: " would show shading to the LEFT of " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " (toward negative numbers). But this graph shows shading to the RIGHT of " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " (toward positive numbers)." }
					]
				},
				{ type: "widgetRef", widgetId: "inequality_direction_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The correct inequality is " },
						{ type: "math", mathml: "<mi>x</mi><mo>&gt;</mo><mn>0</mn>" },
						{ type: "text", content: " because the shading goes toward positive values." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Memory tip: The shading always shows you which values make the inequality true!" }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Good thinking about the direction! You correctly noticed that the shading goes to the right (positive direction), but let's look at the point at " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " more carefully." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The difference between " },
						{ type: "math", mathml: "<mi>x</mi><mo>≤</mo><mn>0</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mi>x</mi><mo>&gt;</mo><mn>0</mn>" },
						{ type: "text", content: " is whether " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " itself is included:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Open circle (○) means the boundary point is NOT included" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Closed circle (●) means the boundary point IS included" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Since this graph shows an open circle at " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: ", the value " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " is NOT included, so we use " },
						{ type: "math", mathml: "<mi>x</mi><mo>&gt;</mo><mn>0</mn>" },
						{ type: "text", content: " (not ≤)." }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! You correctly interpreted both parts of this number line graph." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You noticed that:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• The open circle at " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " means " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " is NOT included" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• The shading extends to the right, representing all positive values" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Together, this gives us " },
						{ type: "math", mathml: "<mi>x</mi><mo>&gt;</mo><mn>0</mn>" },
						{ type: "text", content: " - all values strictly greater than zero." }
					]
				},
				{ type: "widgetRef", widgetId: "inequality_notation_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This skill of reading inequality graphs is essential for solving systems of inequalities and understanding domain/range in functions!" }
					]
				}
			]
		},
		{
			identifier: "D",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Close! You correctly identified the direction (positive values), but let's examine whether " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " itself is included." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The key difference between ≥ and > is the boundary point:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mi>x</mi><mo>≥</mo><mn>0</mn>" },
						{ type: "text", content: " includes " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " (shown with a closed circle ●)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mi>x</mi><mo>&gt;</mo><mn>0</mn>" },
						{ type: "text", content: " excludes " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " (shown with an open circle ○)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Since this graph shows an open circle at " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: ", the correct inequality is " },
						{ type: "math", mathml: "<mi>x</mi><mo>&gt;</mo><mn>0</mn>" },
						{ type: "text", content: ", not " },
						{ type: "math", mathml: "<mi>x</mi><mo>≥</mo><mn>0</mn>" },
						{ type: "text", content: "." }
					]
				}
			]
		}
	]
}

export const verticalNumberLineComparison: AssessmentItemInput = {
	identifier: "vertical-number-line-comparison",
	title: "Compare numbers on a vertical number line",
	responseDeclarations: [
		{
			identifier: "RESPONSE_POS",
			cardinality: "single",
			baseType: "identifier",
			correct: "ABOVE"
		},
		{
			identifier: "RESPONSE_COMP",
			cardinality: "single",
			baseType: "identifier",
			correct: "GT"
		}
	],
	widgets: {
		vertical_nl: {
			type: "numberLine",
			width: 300,
			height: 350,
			orientation: "vertical",
			min: -8,
			max: 2,
			tickInterval: { type: "whole", interval: 2 },
			secondaryTickInterval: null,
			showTickLabels: true,
			highlightedPoints: [
				{ type: "mathml", position: -1.4, mathml: "<mo>-</mo><mn>1.4</mn>", color: "#800080", style: "dot" },
				{ type: "mathml", position: -6.4, mathml: "<mo>-</mo><mn>6.4</mn>", color: "#800000", style: "dot" }
			],
			segments: null,
			model: null
		}
	},
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "Use the number line to compare the numbers." }]
		},
		{ type: "widgetRef", widgetId: "vertical_nl" },
		{
			type: "paragraph",
			content: [
				{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
				{ type: "text", content: " is " },
				{ type: "inlineInteractionRef", interactionId: "pos_choice" },
				{ type: "text", content: " " },
				{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
				{ type: "text", content: ", so " },
				{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
				{ type: "text", content: " is " },
				{ type: "inlineInteractionRef", interactionId: "comp_choice" },
				{ type: "text", content: " " },
				{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
				{ type: "text", content: "." }
			]
		}
	],
	interactions: {
		pos_choice: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE_POS",
			shuffle: true,
			choices: [
				{
					identifier: "ABOVE",
					content: [{ type: "text", content: "above" }]
				},
				{
					identifier: "BELOW",
					content: [{ type: "text", content: "below" }]
				}
			]
		},
		comp_choice: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE_COMP",
			shuffle: true,
			choices: [
				{
					identifier: "GT",
					content: [{ type: "text", content: "greater than" }]
				},
				{
					identifier: "LT",
					content: [{ type: "text", content: "less than" }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "ABOVE",
			outcomeIdentifier: "FEEDBACK__RESPONSE_POS",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent! You correctly identified that " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: " is above " },
						{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
						{ type: "text", content: " on this vertical number line." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You understand that on a vertical number line, numbers get larger as you move up, just like floors in a building! The higher the position, the greater the value." }
					]
				}
			]
		},
		{
			identifier: "BELOW",
			outcomeIdentifier: "FEEDBACK__RESPONSE_POS",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's look at the vertical number line more carefully! On vertical number lines, position tells us about value." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Find " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
						{ type: "text", content: " on the number line. " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: " appears higher up (above) " },
						{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Think of it like a thermometer: " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: "°C is warmer (higher) than " },
						{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
						{ type: "text", content: "°C!" }
					]
				}
			]
		},
		{
			identifier: "GT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_COMP",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! You correctly reasoned that since " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: " is in a higher position, it represents a greater value." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This is a key insight about negative numbers: " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: " is closer to zero than " },
						{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
						{ type: "text", content: ", making it the larger value." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Remember: With negative numbers, the one closer to zero is always greater!" }
					]
				}
			]
		},
		{
			identifier: "LT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_COMP",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "I understand the confusion! Negative numbers can be tricky because they work differently than positive numbers." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Key insight: With negative numbers, the one closer to zero is always greater. " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: " is only " },
						{ type: "math", mathml: "<mn>1.4</mn>" },
						{ type: "text", content: " units away from zero, while " },
						{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
						{ type: "text", content: " is " },
						{ type: "math", mathml: "<mn>6.4</mn>" },
						{ type: "text", content: " units away." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Think about temperature: " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: "°C is warmer (greater) than " },
						{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
						{ type: "text", content: "°C, even though " },
						{ type: "math", mathml: "<mn>6.4</mn>" },
						{ type: "text", content: " > " },
						{ type: "math", mathml: "<mn>1.4</mn>" },
						{ type: "text", content: " for positive numbers." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Therefore: " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
						{ type: "text", content: " > " },
						{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" }
					]
				}
			]
		}
	]
}

export const twoWayFrequencyTable: AssessmentItemInput = {
	identifier: "two-way-frequency-table-cold-study",
	title: "Complete a Two-Way Frequency Table",
	responseDeclarations: [
		{ identifier: "RESPONSE_A", cardinality: "single", baseType: "integer", correct: 23 },
		{ identifier: "RESPONSE_B", cardinality: "single", baseType: "integer", correct: 20 },
		{ identifier: "RESPONSE_C", cardinality: "single", baseType: "integer", correct: 27 },
		{ identifier: "RESPONSE_D", cardinality: "single", baseType: "integer", correct: 30 }
	],
	widgets: {
		venn_widget: {
			type: "vennDiagram",
			width: 350,
			height: 300,
			circleA: { label: "Cold Medicine", count: 27, color: "#1E90FF99" },
			circleB: { label: "Cold longer than 7 days", count: 20, color: "#FF6B6B99" },
			intersectionCount: 23,
			outsideCount: 30
		},
		table_widget: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "condition", label: [], isNumeric: false },
				{ key: "received", label: [{ type: "text", content: "Received cold medicine" }], isNumeric: false },
				{
					key: "notReceived",
					label: [{ type: "text", content: "Did not receive cold medicine" }],
					isNumeric: false
				}
			],
			rowHeaderKey: "condition",
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Cold lasted longer than 7 days" }] },
					{ type: "input", responseIdentifier: "RESPONSE_A", expectedLength: 3 },
					{ type: "input", responseIdentifier: "RESPONSE_B", expectedLength: 3 }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Cold did not last longer than 7 days" }] },
					{ type: "input", responseIdentifier: "RESPONSE_C", expectedLength: 3 },
					{ type: "input", responseIdentifier: "RESPONSE_D", expectedLength: 3 }
				]
			],
			footer: []
		},
		venn_to_table_visual: {
			type: "dataTable",
			title: "Venn to Table Conversion Guide",
			columns: [
				{ key: "region", label: [{ type: "text", content: "Venn Region" }], isNumeric: false },
				{ key: "table_cell", label: [{ type: "text", content: "Table Cell" }], isNumeric: false },
				{ key: "count", label: [{ type: "text", content: "Count" }], isNumeric: true }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Overlap" }] },
					{ type: "inline", content: [{ type: "text", content: "Medicine + Long Cold" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>23</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Medicine Only" }] },
					{ type: "inline", content: [{ type: "text", content: "Medicine + Short Cold" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>27</mn>" }] }
				]
			],
			footer: []
		},
		venn_diagram_breakdown: {
			type: "vennDiagram",
			width: 350,
			height: 300,
			circleA: { label: "Medicine", count: 27, color: "#4285F499" },
			circleB: { label: "Long Cold", count: 20, color: "#FF6B6B99" },
			intersectionCount: 23,
			outsideCount: 30
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "The Cold Be Gone Company conducted a study with " },
				{ type: "math", mathml: "<mn>100</mn>" },
				{
					type: "text",
					content:
						" participants. Each participant either received cold medicine or did not receive cold medicine, and the company recorded whether the participant's cold lasted "
				},
				{ type: "math", mathml: "<mn>7</mn>" },
				{ type: "text", content: " days or longer." }
			]
		},
		{ type: "widgetRef", widgetId: "venn_widget" },
		{
			type: "paragraph",
			content: [{ type: "text", content: "Complete the following two-way frequency table." }]
		},
		{ type: "widgetRef", widgetId: "table_widget" }
	],
	interactions: {},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Outstanding work! You successfully transferred all the data from the Venn diagram to the two-way frequency table." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You correctly identified that the overlap region (" },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " people) represents those who both received medicine AND had a cold lasting " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " days or longer." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This skill of converting between different data representations (Venn diagrams ↔ two-way tables) is crucial for analyzing real-world studies and surveys!" }
					]
				},
				{ type: "widgetRef", widgetId: "venn_to_table_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Challenge: Can you think of another study where a two-way table would help organize the data?" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through converting this Venn diagram to a two-way table step by step! This is a valuable skill for organizing data." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Identify what the overlap represents. The " },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " in the center means " },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " people both received medicine AND had a cold lasting ≥ " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " days." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Calculate the remaining sections:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Medicine circle total is " },
						{ type: "math", mathml: "<mn>27</mn>" },
						{ type: "text", content: ", so medicine-only = " },
						{ type: "math", mathml: "<mn>27</mn><mo>-</mo><mn>23</mn><mo>=</mo><mn>4</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Long cold circle total is " },
						{ type: "math", mathml: "<mn>20</mn>" },
						{ type: "text", content: ", so long-cold-only = " },
						{ type: "math", mathml: "<mn>20</mn><mo>-</mo><mn>23</mn>" },
						{ type: "text", content: "... wait, that's negative! This means we need to recalculate." }
					]
				},
				{ type: "widgetRef", widgetId: "venn_diagram_breakdown" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Remember: The overlap goes in the cell where both conditions are true, then work outward to fill the rest!" }
					]
				}
			]
		}
	]
}

export const equivalentFractionImages: AssessmentItemInput = {
	identifier: "equivalent-fraction-images",
	title: "Identifying Equivalent Fractions with Images",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "multiple",
			baseType: "identifier",
			correct: ["A", "B"]
		}
	],
	widgets: {
		stimulus_shape: {
			type: "partitionedShape",
			mode: "partition",
			width: 300,
			height: 300,
			layout: "horizontal",
			overlays: [],
			shapes: [
				{
					type: "rectangle",
					totalParts: 6,
					shadedCells: [0, 1, 2],
					hatchedCells: [],
					rows: 1,
					columns: 6,
					shadeColor: "#4285F480",
					shadeOpacity: 0.5
				}
			]
		},
		choice_a_shape: {
			type: "partitionedShape",
			mode: "partition",
			width: 300,
			height: 300,
			layout: "horizontal",
			overlays: [],
			shapes: [
				{
					type: "rectangle",
					totalParts: 8,
					shadedCells: [0, 1, 2, 3],
					hatchedCells: [],
					rows: 2,
					columns: 4,
					shadeColor: "#4285F480",
					shadeOpacity: 0.5
				}
			]
		},
		choice_b_shape: {
			type: "partitionedShape",
			mode: "partition",
			width: 300,
			height: 300,
			layout: "horizontal",
			overlays: [],
			shapes: [
				{
					type: "rectangle",
					totalParts: 4,
					shadedCells: [0, 1],
					hatchedCells: [],
					rows: 2,
					columns: 2,
					shadeColor: "#4285F480",
					shadeOpacity: 0.5
				}
			]
		},
		choice_c_shape: {
			type: "partitionedShape",
			mode: "partition",
			width: 300,
			height: 300,
			layout: "horizontal",
			overlays: [],
			shapes: [
				{
					type: "rectangle",
					totalParts: 4,
					shadedCells: [0, 1, 2],
					hatchedCells: [],
					rows: 2,
					columns: 2,
					shadeColor: "#4285F480",
					shadeOpacity: 0.5
				}
			]
		},
		equivalent_fractions_visual: {
			type: "dataTable",
			title: "Equivalent Fraction Examples",
			columns: [
				{ key: "fraction", label: [{ type: "text", content: "Fraction" }], isNumeric: false },
				{ key: "simplified", label: [{ type: "text", content: "Simplified" }], isNumeric: false },
				{ key: "decimal", label: [{ type: "text", content: "Decimal" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>0.5</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mfrac><mn>4</mn><mn>8</mn></mfrac>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>0.5</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mfrac><mn>2</mn><mn>4</mn></mfrac>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>0.5</mn>" }] }
				]
			],
			footer: []
		},
		fraction_comparison_visual: {
			type: "fractionModelDiagram",
			width: 300,
			height: 300,
			shapeType: "box",
			shapes: [
				{
					numerator: 3,
					denominator: 4,
					color: "#FF6B6B"
				}
			],
			operators: null
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
				{ type: "text", content: " of the following rectangle is shaded." }
			]
		},
		{ type: "widgetRef", widgetId: "stimulus_shape" },
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 0,
			maxChoices: 3,
			prompt: [
				{ type: "text", content: "Which of the following rectangles have exactly " },
				{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
				{ type: "text", content: " of their area shaded?" }
			],
			choices: [
				{
					identifier: "A",
					content: [{ type: "widgetRef", widgetId: "choice_a_shape" }]
				},
				{
					identifier: "B",
					content: [{ type: "widgetRef", widgetId: "choice_b_shape" }]
				},
				{
					identifier: "C",
					content: [{ type: "widgetRef", widgetId: "choice_c_shape" }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent choice! This rectangle demonstrates perfect equivalent fraction understanding." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You correctly identified that this rectangle has " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " out of " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " parts shaded, which equals " },
						{ type: "math", mathml: "<mfrac><mn>4</mn><mn>8</mn></mfrac>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Here's why this works: " },
						{ type: "math", mathml: "<mfrac><mn>4</mn><mn>8</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
						{ type: "text", content: " because we can multiply or divide both numerator and denominator by the same number!" }
					]
				},
				{ type: "widgetRef", widgetId: "equivalent_fractions_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This understanding of equivalent fractions is essential for adding fractions, converting between fractions and decimals, and solving proportion problems!" }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Another excellent choice! You found a different rectangle that also shows exactly " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
						{ type: "text", content: " shaded." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This rectangle has " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " out of " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " parts shaded, giving us " },
						{ type: "math", mathml: "<mfrac><mn>2</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The magic of equivalent fractions: " },
						{ type: "math", mathml: "<mfrac><mn>2</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
						{ type: "text", content: " - they all represent the same amount!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You're seeing that the same fraction can look different depending on how we divide the shape, but the actual amount shaded stays the same." }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "I can see why you might choose this! Let's examine this rectangle together and compare it to our target fraction." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This rectangle has " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " out of " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " parts shaded, which gives us " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Now let's check if " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " equals " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
						{ type: "text", content: ". We can simplify " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
						{ type: "text", content: " by dividing both top and bottom by " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ":" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac>" },
						{ type: "text", content: ", but " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " cannot be simplified to " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" }
					]
				},
				{ type: "widgetRef", widgetId: "fraction_comparison_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Remember: To check if fractions are equivalent, simplify both to their lowest terms and see if they match!" }
					]
				}
			]
		}
	]
}

export const calculateShadedArea: AssessmentItemInput = {
	identifier: "calculate-shaded-area",
	title: "Calculating Shaded Area of Multiple Shapes",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "multiple",
			baseType: "identifier",
			correct: ["B", "C"]
		}
	],
	widgets: {
		multi_shape: {
			type: "partitionedShape",
			mode: "partition",
			width: 320,
			height: 300,
			layout: "horizontal",
			overlays: [],
			shapes: [
				{
					type: "circle",
					totalParts: 4,
					shadedCells: [0],
					hatchedCells: [],
					rows: 1,
					columns: 1,
					shadeColor: "#4285F480",
					shadeOpacity: 0.5
				},
				{
					type: "circle",
					totalParts: 4,
					shadedCells: [0],
					hatchedCells: [],
					rows: 1,
					columns: 1,
					shadeColor: "#4285F480",
					shadeOpacity: 0.5
				},
				{
					type: "circle",
					totalParts: 4,
					shadedCells: [0],
					hatchedCells: [],
					rows: 1,
					columns: 1,
					shadeColor: "#4285F480",
					shadeOpacity: 0.5
				},
				{
					type: "circle",
					totalParts: 4,
					shadedCells: [0],
					hatchedCells: [],
					rows: 1,
					columns: 1,
					shadeColor: "#4285F480",
					shadeOpacity: 0.5
				}
			]
		},
		fraction_multiplication_visual: {
			type: "tapeDiagram",
			width: 400,
			height: 300,
			referenceUnitsTotal: null,
			topTape: {
				label: "Multiplying Fractions Visualization",
				unitsTotal: 4,
				extent: null,
				grid: { show: true },
				roundedCaps: null,
				fills: [
					{ 
						span: { by: "units", startUnit: 0, endUnit: 3 },
						style: { kind: "solid", fill: "#4285F4", fillOpacity: null },
						label: {
							text: "1/4 + 1/4 + 1/4",
							placement: "inside"
						}
					}
				]
			},
			bottomTape: null,
			brackets: [
				{
					span: { by: "units", startUnit: 0, endUnit: 4 },
					tape: "top",
					labelTop: "Total fourths",
					labelBottom: null,
					style: { kind: "straight", stroke: "#000000", strokeWidth: 2 }
				}
			]
		}
	},
	body: [
		{ type: "widgetRef", widgetId: "multi_shape" },
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 0,
			maxChoices: 3,
			prompt: [{ type: "text", content: "How can we calculate the shaded area?" }],
			choices: [
				{
					identifier: "A",
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "math", mathml: "<mrow><mn>4</mn><mo>×</mo><mfrac><mn>1</mn><mn>3</mn></mfrac></mrow>" }
							]
						}
					]
				},
				{
					identifier: "B",
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "math", mathml: "<mrow><mn>3</mn><mo>×</mo><mfrac><mn>1</mn><mn>4</mn></mfrac></mrow>" }
							]
						}
					]
				},
				{
					identifier: "C",
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "math",
									mathml:
										"<mrow><mfrac><mn>1</mn><mn>4</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac></mrow>"
								}
							]
						}
					]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "I can see the logic in your thinking! Let's examine what this expression represents and compare it to our actual situation." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The expression " },
						{ type: "math", mathml: "<mn>4</mn><mo>×</mo><mfrac><mn>1</mn><mn>3</mn></mfrac>" },
						{ type: "text", content: " would mean \"" },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " groups, each with " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>3</mn></mfrac>" },
						{ type: "text", content: " shaded.\" But let's count what we actually have:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Number of circles: " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " (not " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: ")" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Fraction shaded in each: " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " (not " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>3</mn></mfrac>" },
						{ type: "text", content: ")" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "So the correct calculation is " },
						{ type: "math", mathml: "<mn>3</mn><mo>×</mo><mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " or " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: "." }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly identified the multiplication approach to this problem." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You reasoned that there are " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " circles, and " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " of each circle is shaded, so we multiply: " },
						{ type: "math", mathml: "<mn>3</mn><mo>×</mo><mfrac><mn>1</mn><mn>4</mn></mfrac><mo>=</mo><mfrac><mn>3</mn><mn>4</mn></mfrac>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This demonstrates excellent understanding of how multiplication works with fractions! When you have multiple identical fractional parts, multiplication is often the most efficient approach." }
					]
				},
				{ type: "widgetRef", widgetId: "fraction_multiplication_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This same thinking applies to real situations: " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " friends each eat " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " of a pizza - how much total pizza was eaten?" }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! You chose the addition approach, which shows excellent understanding of what's actually happening." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Since we have " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " separate circles, each with " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " shaded, we can add them together: " },
						{
							type: "math",
							mathml:
								"<mfrac><mn>1</mn><mn>4</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac><mo>=</mo><mfrac><mn>3</mn><mn>4</mn></mfrac>"
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This addition approach helps you see exactly what's being combined. Notice how adding " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " copies of " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " gives the same result as " },
						{ type: "math", mathml: "<mn>3</mn><mo>×</mo><mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: "!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Both methods work because multiplication is really just repeated addition. Choose whichever method makes more sense to you!" }
					]
				}
			]
		}
	]
}

export const circleEquationCenterRadius: AssessmentItemInput = {
	identifier: "circle-equation-center-radius",
	title: "Find the center and radius of a circle from its equation",
	responseDeclarations: [
		{ identifier: "RESPONSE_X", cardinality: "single", baseType: "integer", correct: -9 },
		{ identifier: "RESPONSE_Y", cardinality: "single", baseType: "integer", correct: -7 },
		{ identifier: "RESPONSE_R", cardinality: "single", baseType: "integer", correct: 5 }
	],
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "A certain circle can be represented by the following equation." }]
		},
		{
			type: "paragraph",
			content: [
				{
					type: "math",
					mathml:
						"<mrow><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup><mo>+</mo><mn>18</mn><mi>x</mi><mo>+</mo><mn>14</mn><mi>y</mi><mo>+</mo><mn>105</mn><mo>=</mo><mn>0</mn></mrow>"
				}
			]
		},
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "What is the center of this circle? (" },
				{ type: "inlineInteractionRef", interactionId: "x_entry" },
				{ type: "text", content: ", " },
				{ type: "inlineInteractionRef", interactionId: "y_entry" },
				{ type: "text", content: ") and radius " },
				{ type: "inlineInteractionRef", interactionId: "r_entry" },
				{ type: "text", content: "?" }
			]
		}
	],
	interactions: {
		x_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_X", expectedLength: 3 },
		y_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_Y", expectedLength: 3 },
		r_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_R", expectedLength: 2 }
	},
	widgets: {
		completing_square_visual: {
			type: "dataTable",
			title: "Completing the Square Steps",
			columns: [
				{ key: "step", label: [{ type: "text", content: "Step" }], isNumeric: false },
				{ key: "equation", label: [{ type: "text", content: "Equation" }], isNumeric: false },
				{ key: "explanation", label: [{ type: "text", content: "What We Did" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>1</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Group x and y terms" }] },
					{ type: "inline", content: [{ type: "text", content: "Separate variables" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>2</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Complete squares" }] },
					{ type: "inline", content: [{ type: "text", content: "Add/subtract constants" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>3</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Standard form" }] },
					{ type: "inline", content: [{ type: "text", content: "Read center and radius" }] }
				]
			],
			footer: []
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Outstanding work! You successfully completed the square and found that the circle is centered at (" },
						{ type: "math", mathml: "<mo>-</mo><mn>9</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mo>-</mo><mn>7</mn>" },
						{ type: "text", content: ") with a radius of " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " units." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You correctly converted the general form to standard form: " },
						{
							type: "math",
							mathml:
								"<msup><mrow><mo>(</mo><mi>x</mi><mo>+</mo><mn>9</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>+</mo><msup><mrow><mo>(</mo><mi>y</mi><mo>+</mo><mn>7</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><mn>25</mn>"
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This demonstrates mastery of completing the square! This technique is crucial for analyzing conic sections, optimizing quadratic functions, and solving quadratic equations." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Remember: In " },
						{ type: "math", mathml: "<msup><mrow><mo>(</mo><mi>x</mi><mo>-</mo><mi>h</mi><mo>)</mo></mrow><mn>2</mn></msup><mo>+</mo><msup><mrow><mo>(</mo><mi>y</mi><mo>-</mo><mi>k</mi><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><msup><mi>r</mi><mn>2</mn></msup>" },
						{ type: "text", content: ", the center is " },
						{ type: "math", mathml: "<mo>(</mo><mi>h</mi><mo>,</mo><mi>k</mi><mo>)</mo>" },
						{ type: "text", content: " and radius is " },
						{ type: "math", mathml: "<mi>r</mi>" },
						{ type: "text", content: "." }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Completing the square can be challenging! Let's work through this step-by-step to find the center and radius." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Starting with: " },
						{
							type: "math",
							mathml:
								"<msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup><mo>+</mo><mn>18</mn><mi>x</mi><mo>+</mo><mn>14</mn><mi>y</mi><mo>+</mo><mn>105</mn><mo>=</mo><mn>0</mn>"
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Group x terms and y terms:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "math", mathml: "<mrow><mo>(</mo><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>18</mn><mi>x</mi><mo>)</mo></mrow><mo>+</mo><mrow><mo>(</mo><msup><mi>y</mi><mn>2</mn></msup><mo>+</mo><mn>14</mn><mi>y</mi><mo>)</mo></mrow><mo>=</mo><mo>-</mo><mn>105</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Complete each square by adding " },
						{ type: "math", mathml: "<msup><mrow><mo>(</mo><mfrac><mi>b</mi><mn>2</mn></mfrac><mo>)</mo></mrow><mn>2</mn></msup>" },
						{ type: "text", content: ":" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "For x: " },
						{ type: "math", mathml: "<msup><mrow><mo>(</mo><mfrac><mn>18</mn><mn>2</mn></mfrac><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><mn>81</mn>" },
						{ type: "text", content: ", for y: " },
						{ type: "math", mathml: "<msup><mrow><mo>(</mo><mfrac><mn>14</mn><mn>2</mn></mfrac><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><mn>49</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Rewrite in standard form:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{
							type: "math",
							mathml: "<msup><mrow><mo>(</mo><mi>x</mi><mo>+</mo><mn>9</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>+</mo><msup><mrow><mo>(</mo><mi>y</mi><mo>+</mo><mn>7</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><mn>25</mn>"
						}
					]
				},
				{ type: "widgetRef", widgetId: "completing_square_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Therefore: center = (" },
						{ type: "math", mathml: "<mo>-</mo><mn>9</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mo>-</mo><mn>7</mn>" },
						{ type: "text", content: ") and radius = " },
						{ type: "math", mathml: "<msqrt><mn>25</mn></msqrt><mo>=</mo><mn>5</mn>" }
					]
				}
			]
		}
	]
}

export const harukaExamScore: AssessmentItemInput = {
	identifier: "haruka-exam-score",
	title: "Find a missing data point given the mean",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "integer",
			correct: 87
		}
	],
	widgets: {
		score_table: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "exam", label: [{ type: "text", content: "Final exam" }], isNumeric: false },
				{ key: "score", label: [{ type: "text", content: "Score on a 100-point scale" }], isNumeric: true }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Astronomy" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>72</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Biology" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>85</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Physics" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>92</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Chemistry" }] },
					{ type: "inline", content: [{ type: "text", content: "?" }] }
				]
			],
			footer: []
		},
		mean_calculation_visual: {
			type: "dataTable",
			title: "Mean Calculation Breakdown",
			columns: [
				{ key: "step", label: [{ type: "text", content: "Step" }], isNumeric: false },
				{ key: "calculation", label: [{ type: "text", content: "Calculation" }], isNumeric: false },
				{ key: "result", label: [{ type: "text", content: "Result" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>1</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Total = Mean × Count" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>84</mn><mo>×</mo><mn>4</mn><mo>=</mo><mn>336</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>2</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Sum known scores" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>72</mn><mo>+</mo><mn>85</mn><mo>+</mo><mn>92</mn><mo>=</mo><mn>249</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>3</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Find missing score" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>336</mn><mo>-</mo><mn>249</mn><mo>=</mo><mn>87</mn>" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "The following table shows each of Haruka's final exam scores last semester." }
			]
		},
		{ type: "widgetRef", widgetId: "score_table" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "If the mean of the data set is " },
				{ type: "math", mathml: "<mn>84</mn>" },
				{ type: "text", content: " points, find Haruka's final exam score in chemistry. " },
				{ type: "inlineInteractionRef", interactionId: "text_entry" }
			]
		}
	],
	interactions: {
		text_entry: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE",
			expectedLength: 3
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly found that Haruka scored " },
						{ type: "math", mathml: "<mn>87</mn>" },
						{ type: "text", content: " points on her chemistry exam." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated solid understanding of how to work backwards from a mean! You used the fact that if the mean of " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " scores is " },
						{ type: "math", mathml: "<mn>84</mn>" },
						{ type: "text", content: ", then the total must be " },
						{ type: "math", mathml: "<mn>4</mn><mo>×</mo><mn>84</mn><mo>=</mo><mn>336</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Then you subtracted the known scores: " },
						{ type: "math", mathml: "<mn>336</mn><mo>-</mo><mn>72</mn><mo>-</mo><mn>85</mn><mo>-</mo><mn>92</mn><mo>=</mo><mn>87</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This reverse-engineering skill is incredibly useful for quality control, budgeting, and analyzing incomplete data sets!" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through finding the missing score using the mean! This is a great problem-solving strategy." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Use the mean formula. Mean = " },
						{ type: "math", mathml: "<mfrac><mtext>Sum of all scores</mtext><mtext>Number of scores</mtext></mfrac>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Find the total sum. If mean = " },
						{ type: "math", mathml: "<mn>84</mn>" },
						{ type: "text", content: " and there are " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " scores, then:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Total sum = " },
						{ type: "math", mathml: "<mn>84</mn><mo>×</mo><mn>4</mn><mo>=</mo><mn>336</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Subtract the known scores:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Chemistry score = " },
						{ type: "math", mathml: "<mn>336</mn><mo>-</mo><mn>72</mn><mo>-</mo><mn>85</mn><mo>-</mo><mn>92</mn><mo>=</mo><mn>87</mn>" }
					]
				},
				{ type: "widgetRef", widgetId: "mean_calculation_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Therefore, Haruka scored " },
						{ type: "math", mathml: "<mn>87</mn>" },
						{ type: "text", content: " points on her chemistry exam." }
					]
				}
			]
		}
	]
}

export const libertyvilleBusinessCycle: AssessmentItemInput = {
	identifier: "libertyville-business-cycle",
	title: "Business Cycle Trough Identification",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "C"
		}
	],
	widgets: {
		gdp_table: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "year", label: [{ type: "text", content: "Year" }], isNumeric: false },
				{ key: "gdp", label: [{ type: "text", content: "GDP (% change)" }], isNumeric: true },
				{
					key: "unemployment",
					label: [{ type: "text", content: "Unemployment (% of the labor force)" }],
					isNumeric: true
				}
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "2014" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>0</mn><mo>%</mo>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>7</mn><mo>%</mo>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "2015" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>1</mn><mo>%</mo>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>8</mn><mo>%</mo>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "2016" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>2</mn><mo>%</mo>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>10</mn><mo>%</mo>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "2017" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>2</mn><mo>%</mo>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>6</mn><mo>%</mo>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "2018" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>4</mn><mo>%</mo>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>5</mn><mo>%</mo>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "2019" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>1</mn><mo>%</mo>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>6</mn><mo>%</mo>" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"The table below shows the gross domestic product (GDP) and unemployment data for Libertyville over five years"
				}
			]
		},
		{ type: "widgetRef", widgetId: "gdp_table" },
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [
				{
					type: "text",
					content: "In which of the years was Libertyville most likely experiencing a trough in its business cycle?"
				}
			],
			choices: [
				{
					identifier: "A",
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", content: "2014" }]
						}
					]
				},
				{
					identifier: "B",
					content: [{ type: "paragraph", content: [{ type: "text", content: "2015" }] }]
				},
				{
					identifier: "C",
					content: [{ type: "paragraph", content: [{ type: "text", content: "2016" }] }]
				},
				{
					identifier: "D",
					content: [{ type: "paragraph", content: [{ type: "text", content: "2017" }] }]
				},
				{
					identifier: "E",
					content: [{ type: "paragraph", content: [{ type: "text", content: "2018" }] }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"GDP fell for the two years following 2014, indicating that Libertyville entered the recession phase of its business cycle in 2014. A trough is the turning point at which a recession ends and an expansion begins."
						}
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"GDP fell in 2015, indicating that Libertyville was in the recession phase of its business cycle in 2015. However the economy still had further to fall before it started to turn around. A trough is the turning point at which a recession ends and an expansion begins."
						}
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"GDP fell in 2016 but increased in 2017, indicating that 2016 was the turning point at which Libertyville's two year recession ended and the economy entered the recovery/expansion phase of its business cycle."
						}
					]
				}
			]
		},
		{
			identifier: "D",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"GDP increased in 2017, indicating that Libertyville was in the expansion phase of its business cycle. A trough is the turning point at which a recession ends and an expansion begins."
						}
					]
				}
			]
		},
		{
			identifier: "E",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"GDP increased in 2018, indicating that Libertyville was in the expansion phase of its business cycle. A trough is the turning point at which a recession ends and an expansion begins."
						}
					]
				}
			]
		}
	]
}

export const continuityDifferentiabilityPiecewise: AssessmentItemInput = {
	identifier: "continuity-differentiability-piecewise",
	title: "Continuity and Differentiability of a Piecewise Function",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "C"
		}
	],
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "math",
					mathml:
						'<mrow><mi>f</mi><mo stretchy="false">(</mo><mi>x</mi><mo stretchy="false">)</mo><mo>=</mo><mrow><mo>{</mo><mtable><mtr><mtd columnalign="left"><mrow><mo>-</mo><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>3</mn></mrow></mtd><mtd columnalign="left"><mrow><mo>,</mo><mi>x</mi><mo>≤</mo><mn>2</mn></mrow></mtd></mtr><mtr><mtd columnalign="left"><mrow><msup><mrow><mo stretchy="false">(</mo><mi>x</mi><mo>-</mo><mn>4</mn><mo stretchy="false">)</mo></mrow><mn>2</mn></msup><mo>-</mo><mn>5</mn></mrow></mtd><mtd columnalign="left"><mrow><mo>,</mo><mi>x</mi><mo>&gt;</mo><mn>2</mn></mrow></mtd></mtr></mtable></mrow></mrow>'
				}
			]
		},
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [
				{ type: "text", content: "Is the function given below continuous/differentiable at " },
				{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>2</mn>" },
				{ type: "text", content: "?" }
			],
			choices: [
				{
					identifier: "A",
					content: [{ type: "paragraph", content: [{ type: "text", content: "continuous, not differentiable" }] }]
				},
				{
					identifier: "B",
					content: [{ type: "paragraph", content: [{ type: "text", content: "differentiable, not continuous" }] }]
				},
				{
					identifier: "C",
					content: [{ type: "paragraph", content: [{ type: "text", content: "both continuous and differentiable" }] }]
				},
				{
					identifier: "D",
					content: [
						{ type: "paragraph", content: [{ type: "text", content: "neither continuous nor differentiable" }] }
					]
				}
			]
		}
	},
	widgets: null,
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This would be the case if the function values matched at " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>2</mn>" },
						{
							type: "text",
							content:
								" but the derivatives from left and right were different. Check both the limit values and the derivatives."
						}
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content: "This is impossible! A function must be continuous at a point to be differentiable there."
						}
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! The function values match at " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>2</mn>" },
						{ type: "text", content: " (both equal " },
						{ type: "math", mathml: "<mo>-</mo><mn>1</mn>" },
						{ type: "text", content: ") and the derivatives from both sides equal " },
						{ type: "math", mathml: "<mo>-</mo><mn>4</mn>" },
						{ type: "text", content: ", so the function is both continuous and differentiable." }
					]
				}
			]
		},
		{
			identifier: "D",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Not quite. The function doesn't have a jump discontinuity at " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>2</mn>" },
						{ type: "text", content: ". Check if the left and right limits at " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>2</mn>" },
						{ type: "text", content: " are equal." }
					]
				}
			]
		}
	]
}

export const stokesTheoremRewrite: AssessmentItemInput = {
	identifier: "stokes-theorem-rewrite",
	title: "Rewrite Surface Integral using Stokes' Theorem",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "string",
			correct: "x^2/2-x*cos(z)"
		}
	],
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "Use Stokes' theorem to rewrite the surface integral as a line integral. " },
				{ type: "inlineInteractionRef", interactionId: "text_entry" }
			]
		}
	],
	interactions: {
		text_entry: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE",
			expectedLength: 20
		}
	},
	widgets: null,
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "Correct!" }]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "Not quite. Let's use Stokes' theorem to solve this." }]
				}
			]
		}
	]
}

export const estimateDerivativeFromTable: AssessmentItemInput = {
	identifier: "estimate-derivative-from-table",
	title: "Estimate derivative from a table of values",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "D"
		}
	],
	widgets: {
		h_table: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "x", label: [], isNumeric: false },
				{ key: "minus9", label: [], isNumeric: true },
				{ key: "minus8", label: [], isNumeric: true },
				{ key: "minus6", label: [], isNumeric: true },
				{ key: "minus3", label: [], isNumeric: true },
				{ key: "minus2", label: [], isNumeric: true },
				{ key: "minus1", label: [], isNumeric: true }
			],
			rowHeaderKey: "x",
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mi>x</mi>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>9</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>8</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>6</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>3</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>2</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>1</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mi>h</mi><mo>(</mo><mi>x</mi><mo>)</mo>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>30</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>29</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>36</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>20</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>35</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>47</mn>" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "This table gives select values of the differentiable function " },
				{ type: "math", mathml: "<mi>h</mi>" },
				{ type: "text", content: "." }
			]
		},
		{ type: "widgetRef", widgetId: "h_table" },
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [
				{ type: "text", content: "What is the best estimate for " },
				{
					type: "math",
					mathml: "<mrow><msup><mi>h</mi><mo>'</mo></msup><mo>(</mo><mo>-</mo><mn>4</mn><mo>)</mo></mrow>"
				},
				{ type: "text", content: " we can make based on this table?" }
			],
			choices: [
				{
					identifier: "A",
					content: [{ type: "paragraph", content: [{ type: "math", mathml: "<mo>-</mo><mn>28</mn>" }] }]
				},
				{
					identifier: "B",
					content: [{ type: "paragraph", content: [{ type: "math", mathml: "<mo>-</mo><mn>13.5</mn>" }] }]
				},
				{
					identifier: "C",
					content: [{ type: "paragraph", content: [{ type: "math", mathml: "<mo>-</mo><mn>2.125</mn>" }] }]
				},
				{
					identifier: "D",
					content: [{ type: "paragraph", content: [{ type: "math", mathml: "<mn>5.33</mn>" }] }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This can be an estimate for " },
						{ type: "math", mathml: "<mi>h</mi><mo>(</mo><mo>-</mo><mn>4</mn><mo>)</mo>" },
						{ type: "text", content: ", but we are looking for " },
						{ type: "math", mathml: "<msup><mi>h</mi><mo>'</mo></msup><mo>(</mo><mo>-</mo><mn>4</mn><mo>)</mo>" },
						{ type: "text", content: "." }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "We should pick an interval that includes " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mo>-</mo><mn>4</mn>" },
						{ type: "text", content: "." }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "We can pick a closer interval to estimate " },
						{ type: "math", mathml: "<msup><mi>h</mi><mo>'</mo></msup>" },
						{ type: "text", content: " specifically at " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mo>-</mo><mn>4</mn>" },
						{ type: "text", content: "." }
					]
				}
			]
		},
		{
			identifier: "D",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content: "Correct! The best estimate uses the narrowest interval available that contains -4."
						}
					]
				}
			]
		}
	]
}

export const countApplesEmoji: AssessmentItemInput = {
	identifier: "count-apples-emoji",
	title: "Count the apples",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "CHOICE_5"
		}
	],
	widgets: {
		choice_3_apples: {
			type: "discreteObjectRatioDiagram",
			title: null,
			width: 300,
			height: 300,
			objects: [{ count: 3, emoji: "🍎" }]
		},
		choice_4_apples: {
			type: "discreteObjectRatioDiagram",
			title: null,
			width: 300,
			height: 300,
			objects: [{ count: 4, emoji: "🍎" }]
		},
		choice_5_apples: {
			type: "discreteObjectRatioDiagram",
			title: null,
			width: 300,
			height: 300,
			objects: [{ count: 5, emoji: "🍎" }]
		},
		choice_6_apples: {
			type: "discreteObjectRatioDiagram",
			title: null,
			width: 300,
			height: 300,
			objects: [{ count: 6, emoji: "🍎" }]
		}
	},
	body: [{ type: "interactionRef", interactionId: "choice_interaction" }],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [
				{ type: "text", content: "Which box has " },
				{ type: "math", mathml: "<mn>5</mn>" },
				{ type: "text", content: " apples?" }
			],
			choices: [
				{
					identifier: "CHOICE_3",
					content: [{ type: "widgetRef", widgetId: "choice_3_apples" }]
				},
				{
					identifier: "CHOICE_4",
					content: [{ type: "widgetRef", widgetId: "choice_4_apples" }]
				},
				{
					identifier: "CHOICE_5",
					content: [{ type: "widgetRef", widgetId: "choice_5_apples" }]
				},
				{
					identifier: "CHOICE_6",
					content: [{ type: "widgetRef", widgetId: "choice_6_apples" }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "CHOICE_3",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's count together! This box has " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " apples, but we're looking for " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " apples." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Counting tip: Point to each apple as you count: " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ". This helps make sure you don't skip any or count the same one twice!" }
					]
				}
			]
		},
		{
			identifier: "CHOICE_4",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Close! This box has " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " apples, which is very close to " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: ", but we need exactly " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " apples." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You're getting good at counting! Keep looking for the box that has exactly " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " apples - one more than this box has." }
					]
				}
			]
		},
		{
			identifier: "CHOICE_5",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! You found the box with exactly " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " apples." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated excellent counting skills! Counting accurately is the foundation for all of mathematics - from addition and subtraction to more advanced concepts." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Challenge: Can you arrange " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " objects in different patterns? Try making a line, a circle, or a triangle!" }
					]
				}
			]
		},
		{
			identifier: "CHOICE_6",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This box has " },
						{ type: "math", mathml: "<mn>6</mn>" },
						{ type: "text", content: " apples, which is " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: " more than the " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " we're looking for." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Great counting! You correctly identified that this box has " },
						{ type: "math", mathml: "<mn>6</mn>" },
						{ type: "text", content: " apples. Now look for the box that has exactly " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " apples - one less than this box." }
					]
				}
			]
		}
	]
}

export const reactantAmountsTemperatureTableWithDropdowns: AssessmentItemInput = {
	identifier: "reactant-amounts-temp-change-table",
	title: "Identify reactants and amounts from temperature change table",
	responseDeclarations: [
		{ identifier: "RESPONSE_REACT_C", cardinality: "single", baseType: "identifier", correct: "MGSO4" },
		{ identifier: "RESPONSE_AMT_C", cardinality: "single", baseType: "identifier", correct: "AMT_2_5" },
		{ identifier: "RESPONSE_REACT_D", cardinality: "single", baseType: "identifier", correct: "NH4CL" },
		{ identifier: "RESPONSE_AMT_D", cardinality: "single", baseType: "identifier", correct: "AMT_3_0" },
		{ identifier: "RESPONSE_REACT_E", cardinality: "single", baseType: "identifier", correct: "CACL2" },
		{ identifier: "RESPONSE_AMT_E", cardinality: "single", baseType: "identifier", correct: "AMT_8_0" },
		{ identifier: "RESPONSE_TEXT_ENTRY", cardinality: "single", baseType: "string", correct: "done" }
	],
	widgets: {
		react_temp_table: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "experiment", label: [{ type: "text", content: "Experiment" }], isNumeric: false },
				{ key: "reactant", label: [{ type: "text", content: "Reactant" }], isNumeric: false },
				{ key: "amount", label: [{ type: "text", content: "Amount of reactant (grams)" }], isNumeric: false },
				{ key: "temp", label: [{ type: "text", content: "Temperature change" }], isNumeric: false }
			],
			rowHeaderKey: "experiment",
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "A" }] },
					{ type: "inline", content: [{ type: "text", content: "NH4Cl" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>6.0</mn><mtext> grams</mtext>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>3.6</mn><mo>°</mo><mi>C</mi>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "B" }] },
					{ type: "inline", content: [{ type: "text", content: "MgSO4" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>5.0</mn><mtext> grams</mtext>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mo>+</mo><mn>1.0</mn><mo>°</mo><mi>C</mi>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "C" }] },
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_REACT_C",
						shuffle: true,
						choices: [
							{ identifier: "NH4CL", content: [{ type: "text", content: "NH4Cl" }] },
							{ identifier: "MGSO4", content: [{ type: "text", content: "MgSO4" }] },
							{ identifier: "CACL2", content: [{ type: "text", content: "CaCl2" }] }
						]
					},
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_AMT_C",
						shuffle: true,
						choices: [
							{ identifier: "AMT_2_5", content: [{ type: "math", mathml: "<mn>2.5</mn>" }] },
							{ identifier: "AMT_3_0", content: [{ type: "math", mathml: "<mn>3.0</mn>" }] },
							{ identifier: "AMT_8_0", content: [{ type: "math", mathml: "<mn>8.0</mn>" }] }
						]
					},
					{ type: "inline", content: [{ type: "math", mathml: "<mo>+</mo><mn>0.5</mn><mo>°</mo><mi>C</mi>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "D" }] },
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_REACT_D",
						shuffle: true,
						choices: [
							{ identifier: "NH4CL", content: [{ type: "text", content: "NH4Cl" }] },
							{ identifier: "MGSO4", content: [{ type: "text", content: "MgSO4" }] },
							{ identifier: "CACL2", content: [{ type: "text", content: "CaCl2" }] }
						]
					},
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_AMT_D",
						shuffle: true,
						choices: [
							{ identifier: "AMT_2_5", content: [{ type: "math", mathml: "<mn>2.5</mn>" }] },
							{ identifier: "AMT_3_0", content: [{ type: "math", mathml: "<mn>3.0</mn>" }] },
							{ identifier: "AMT_8_0", content: [{ type: "math", mathml: "<mn>8.0</mn>" }] }
						]
					},
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>1.8</mn><mo>°</mo><mi>C</mi>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "E" }] },
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_REACT_E",
						shuffle: true,
						choices: [
							{ identifier: "NH4CL", content: [{ type: "text", content: "NH4Cl" }] },
							{ identifier: "MGSO4", content: [{ type: "text", content: "MgSO4" }] },
							{ identifier: "CACL2", content: [{ type: "text", content: "CaCl2" }] }
						]
					},
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_AMT_E",
						shuffle: true,
						choices: [
							{ identifier: "AMT_2_5", content: [{ type: "math", mathml: "<mn>2.5</mn>" }] },
							{ identifier: "AMT_3_0", content: [{ type: "math", mathml: "<mn>3.0</mn>" }] },
							{ identifier: "AMT_8_0", content: [{ type: "math", mathml: "<mn>8.0</mn>" }] }
						]
					},
					{ type: "inline", content: [{ type: "math", mathml: "<mo>+</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" }] }
				]
			],
			footer: []
		},
		temperature_analysis_visual: {
			type: "dataTable",
			title: "Temperature Change Analysis",
			columns: [
				{ key: "compound", label: [{ type: "text", content: "Compound" }], isNumeric: false },
				{ key: "effect", label: [{ type: "text", content: "Effect Type" }], isNumeric: false },
				{ key: "pattern", label: [{ type: "text", content: "Pattern" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mi>N</mi><msub><mi>H</mi><mn>4</mn></msub><mi>Cl</mi>" }] },
					{ type: "inline", content: [{ type: "text", content: "Endothermic" }] },
					{ type: "inline", content: [{ type: "text", content: "Cools solution" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mi>Mg</mi><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub>" }] },
					{ type: "inline", content: [{ type: "text", content: "Exothermic" }] },
					{ type: "inline", content: [{ type: "text", content: "Heats solution" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mi>Ca</mi><msub><mi>Cl</mi><mn>2</mn></msub>" }] },
					{ type: "inline", content: [{ type: "text", content: "Exothermic" }] },
					{ type: "inline", content: [{ type: "text", content: "Heats solution" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"Use the data provided to identify the reactant and amount that caused each temperature change. Each option is only used once."
				}
			]
		},
		{ type: "widgetRef", widgetId: "react_temp_table" },
		{
			type: "paragraph",
			content: [{ type: "text", content: "Select the reactant and amount for rows C, D, and E directly in the table." }]
		}
	],
	interactions: {
		text_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TEXT_ENTRY", expectedLength: 10 }
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Outstanding work! You successfully matched all the reactants and amounts to their corresponding temperature changes." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated excellent understanding of how different compounds affect temperature differently. Some compounds absorb heat (endothermic) while others release heat (exothermic)." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You also recognized that concentration matters - more of the same compound typically produces a stronger effect. This is a fundamental principle in chemistry!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This type of analysis is crucial for understanding chemical reactions, designing experiments, and predicting outcomes in laboratory settings." }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This is a challenging puzzle! Let's work through it systematically by looking for patterns in the data." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Identify reaction types. Look at the temperature changes:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Negative changes (cooling) = endothermic reactions" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Positive changes (heating) = exothermic reactions" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Look for concentration effects. More of the same compound usually produces a stronger effect (higher magnitude temperature change)." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Match compounds to their characteristic effects and scale by amount." }
					]
				},
				{ type: "widgetRef", widgetId: "temperature_analysis_visual" }
			]
		}
	]
}

export const attractRepelCompletionTable: AssessmentItemInput = {
	identifier: "attract-repel-completion-table",
	title: "Complete the table: attract or repel",
	responseDeclarations: [
		{ identifier: "RESPONSE_R1", cardinality: "single", baseType: "identifier", correct: "REPEL" },
		{ identifier: "RESPONSE_R2", cardinality: "single", baseType: "identifier", correct: "ATTRACT" },
		{ identifier: "RESPONSE_R3", cardinality: "single", baseType: "identifier", correct: "ATTRACT" },
		{ identifier: "RESPONSE_R4", cardinality: "single", baseType: "identifier", correct: "REPEL" },
		{ identifier: "RESPONSE_TEXT_ENTRY", cardinality: "single", baseType: "string", correct: "done" }
	],
	widgets: {
		attract_repel_table: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "description", label: [{ type: "text", content: "Description of objects" }], isNumeric: false },
				{
					key: "result",
					label: [{ type: "text", content: "Will the objects attract or repel each other?" }],
					isNumeric: false
				}
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "two charged objects, both with positive charge" }] },
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_R1",
						shuffle: false,
						choices: [
							{ identifier: "ATTRACT", content: [{ type: "text", content: "attract" }] },
							{ identifier: "REPEL", content: [{ type: "text", content: "repel" }] }
						]
					}
				],
				[
					{
						type: "inline",
						content: [
							{
								type: "text",
								content: "two charged objects, one with positive charge and the other with negative charge"
							}
						]
					},
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_R2",
						shuffle: false,
						choices: [
							{ identifier: "ATTRACT", content: [{ type: "text", content: "attract" }] },
							{ identifier: "REPEL", content: [{ type: "text", content: "repel" }] }
						]
					}
				],
				[
					{
						type: "inline",
						content: [
							{ type: "text", content: "two magnets, with the north pole of one facing the south pole of the other" }
						]
					},
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_R3",
						shuffle: false,
						choices: [
							{ identifier: "ATTRACT", content: [{ type: "text", content: "attract" }] },
							{ identifier: "REPEL", content: [{ type: "text", content: "repel" }] }
						]
					}
				],
				[
					{
						type: "inline",
						content: [{ type: "text", content: "two magnets, with their south poles facing each other" }]
					},
					{
						type: "dropdown",
						responseIdentifier: "RESPONSE_R4",
						shuffle: false,
						choices: [
							{ identifier: "ATTRACT", content: [{ type: "text", content: "attract" }] },
							{ identifier: "REPEL", content: [{ type: "text", content: "repel" }] }
						]
					}
				]
			],
			footer: []
		},
		force_rules_visual: {
			type: "dataTable",
			title: "Force Rules Summary",
			columns: [
				{ key: "force_type", label: [{ type: "text", content: "Force Type" }], isNumeric: false },
				{ key: "like_objects", label: [{ type: "text", content: "Like Objects" }], isNumeric: false },
				{ key: "opposite_objects", label: [{ type: "text", content: "Opposite Objects" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Electric" }] },
					{ type: "inline", content: [{ type: "text", content: "Repel" }] },
					{ type: "inline", content: [{ type: "text", content: "Attract" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Magnetic" }] },
					{ type: "inline", content: [{ type: "text", content: "Repel" }] },
					{ type: "inline", content: [{ type: "text", content: "Attract" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{ type: "paragraph", content: [{ type: "text", content: "Complete the table for each pair of objects." }] },
		{ type: "widgetRef", widgetId: "attract_repel_table" }
	],
	interactions: {
		text_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TEXT_ENTRY", expectedLength: 10 }
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! You correctly applied the fundamental rule: like charges and poles repel, while opposites attract." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You understood that:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " positive charges → repel (like pushing like)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Positive and negative charges → attract (opposites pull together)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• North and south magnetic poles → attract (opposites pull together)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " south magnetic poles → repel (like pushing like)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This fundamental principle governs everything from why balloons stick to walls after rubbing them, to how electric motors work, to why compass needles point north!" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through the fundamental rules of electric and magnetic forces! These are some of the most important principles in physics." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The Universal Rule: \"Likes repel, opposites attract\"" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "For electric charges:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Positive + Positive = repel (push away)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Negative + Negative = repel (push away)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Positive + Negative = attract (pull together)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "For magnetic poles:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• North + North = repel" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• South + South = repel" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• North + South = attract" }
					]
				},
				{ type: "widgetRef", widgetId: "force_rules_visual" }
			]
		}
	]
}

export const shapeBinBarChart: AssessmentItemInput = {
	identifier: "shape-bin-barchart-choice",
	title: "Create a bar graph for shapes in a bin",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "A"
		}
	],
	widgets: {
		shapes_table: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "shape", label: [{ type: "text", content: "Type of shape" }], isNumeric: false },
				{ key: "count", label: [{ type: "text", content: "Number of shapes" }], isNumeric: true }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Triangles" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>8</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Circles" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>5</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Rectangles" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>3</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Squares" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>9</mn>" }] }
				]
			],
			footer: []
		},
		chart_a: {
			type: "barChart",
			title: "",
			width: 400,
			height: 300,
			xAxisLabel: "Type of shape",
			yAxis: { label: "Number of shape", min: 0, max: 10, tickInterval: 2 },
			data: [
				{ label: "Triangles", value: 8, state: "normal" },
				{ label: "Circles", value: 5, state: "normal" },
				{ label: "Rectangles", value: 3, state: "normal" },
				{ label: "Squares", value: 9, state: "normal" }
			],
			barColor: "#4285F4"
		},
		chart_b: {
			type: "barChart",
			title: "",
			width: 400,
			height: 300,
			xAxisLabel: "Type of shape",
			yAxis: { label: "Number of shape", min: 0, max: 10, tickInterval: 2 },
			data: [
				{ label: "Triangles", value: 9, state: "normal" },
				{ label: "Circles", value: 5, state: "normal" },
				{ label: "Rectangles", value: 3, state: "normal" },
				{ label: "Squares", value: 8, state: "normal" }
			],
			barColor: "#4285F4"
		},
		chart_c: {
			type: "barChart",
			title: "",
			width: 400,
			height: 300,
			xAxisLabel: "Type of shape",
			yAxis: { label: "Number of shape", min: 0, max: 10, tickInterval: 2 },
			data: [
				{ label: "Triangles", value: 7, state: "normal" },
				{ label: "Circles", value: 4, state: "normal" },
				{ label: "Rectangles", value: 2, state: "normal" },
				{ label: "Squares", value: 10, state: "normal" }
			],
			barColor: "#4285F4"
		},
		chart_d: {
			type: "barChart",
			title: "",
			width: 400,
			height: 300,
			xAxisLabel: "Type of shape",
			yAxis: { label: "Number of shape", min: 0, max: 10, tickInterval: 2 },
			data: [
				{ label: "Triangles", value: 4, state: "normal" },
				{ label: "Circles", value: 8, state: "normal" },
				{ label: "Rectangles", value: 9, state: "normal" },
				{ label: "Squares", value: 3, state: "normal" }
			],
			barColor: "#4285F4"
		}
	},
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "A second grade classroom has a bin of shapes." }]
		},
		{ type: "widgetRef", widgetId: "shapes_table" },
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [{ type: "text", content: "Which bar graph correctly shows the number of shapes in the bin?" }],
			choices: [
				{
					identifier: "A",
					content: [{ type: "widgetRef", widgetId: "chart_a" }]
				},
				{
					identifier: "B",
					content: [{ type: "widgetRef", widgetId: "chart_b" }]
				},
				{
					identifier: "C",
					content: [{ type: "widgetRef", widgetId: "chart_c" }]
				},
				{
					identifier: "D",
					content: [{ type: "widgetRef", widgetId: "chart_d" }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! The chosen graph perfectly matches the data provided in the table." }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"Not quite. Match the number of shapes from the table to the height of the bar for each shape type."
						}
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"Not quite. Match the number of shapes from the table to the height of the bar for each shape type."
						}
					]
				}
			]
		},
		{
			identifier: "D",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"Not quite. Match the number of shapes from the table to the height of the bar for each shape type."
						}
					]
				}
			]
		}
	]
}

export const pencilLengthLinePlot: AssessmentItemInput = {
	identifier: "pencil-length-line-plot-choice",
	title: "Represent Pencil Lengths on a Line Plot",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "A"
		}
	],
	widgets: {
		plot_a: {
			type: "dotPlot",
			width: 450,
			height: 300,
			axis: { min: 0, max: 12, tickInterval: 2, label: null },
			data: [
				{ value: 3, count: 1 },
				{ value: 8, count: 2 },
				{ value: 11, count: 1 }
			],
			dotColor: "#0074c8",
			dotRadius: 8
		},
		plot_b: {
			type: "dotPlot",
			width: 450,
			height: 300,
			axis: { min: 0, max: 12, tickInterval: 2, label: null },
			data: [
				{ value: 3, count: 1 },
				{ value: 8, count: 1 },
				{ value: 11, count: 1 }
			],
			dotColor: "#0074c8",
			dotRadius: 8
		},
		plot_c: {
			type: "dotPlot",
			width: 450,
			height: 300,
			axis: { min: 0, max: 12, tickInterval: 2, label: null },
			data: [{ value: 4, count: 4 }],
			dotColor: "#0074c8",
			dotRadius: 8
		},
		plot_d: {
			type: "dotPlot",
			width: 450,
			height: 300,
			axis: { min: 0, max: 12, tickInterval: 2, label: null },
			data: [
				{ value: 4, count: 1 },
				{ value: 9, count: 2 },
				{ value: 12, count: 1 }
			],
			dotColor: "#0074c8",
			dotRadius: 8
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "The lengths of 4 pencils were measured. The lengths are " },
				{ type: "math", mathml: "<mn>11</mn><mtext> cm</mtext>" },
				{ type: "text", content: ", " },
				{ type: "math", mathml: "<mn>8</mn><mtext> cm</mtext>" },
				{ type: "text", content: ", " },
				{ type: "math", mathml: "<mn>8</mn><mtext> cm</mtext>" },
				{ type: "text", content: ", and " },
				{ type: "math", mathml: "<mn>3</mn><mtext> cm</mtext>" },
				{ type: "text", content: "." }
			]
		},
		{ type: "interactionRef", interactionId: "choice_interaction" }
	],
	interactions: {
		choice_interaction: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [{ type: "text", content: "Which line plot correctly shows the length of each pencil?" }],
			choices: [
				{
					identifier: "A",
					content: [{ type: "widgetRef", widgetId: "plot_a" }]
				},
				{
					identifier: "B",
					content: [{ type: "widgetRef", widgetId: "plot_b" }]
				},
				{
					identifier: "C",
					content: [{ type: "widgetRef", widgetId: "plot_c" }]
				},
				{
					identifier: "D",
					content: [{ type: "widgetRef", widgetId: "plot_d" }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content: "This plot correctly shows a dot for each of the 4 pencils at its measured length."
						}
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content: "This plot only shows one dot for the length of "
						},
						{ type: "math", mathml: "<mn>8</mn><mtext> cm</mtext>" },
						{ type: "text", content: ". Remember, there were two pencils with this length." }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content: "This plot shows four dots above the number "
						},
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: ". This represents the total number of pencils, not their individual lengths." }
					]
				}
			]
		},
		{
			identifier: "D",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content: "Check the data again carefully to make sure the dots are placed above the correct numbers."
						}
					]
				}
			]
		}
	]
}

export const gamesWonBarChart: AssessmentItemInput = {
	identifier: "games-won-barchart",
	title: "Reading a bar chart",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "integer",
			correct: 14
		}
	],
	widgets: {
		games_chart: {
			type: "barChart",
			title: "",
			width: 480,
			height: 340,
			xAxisLabel: "Team",
			yAxis: {
				label: "Games Won",
				min: 0,
				max: 16,
				tickInterval: 2
			},
			data: [
				{ label: "Lions", value: 14, state: "normal" },
				{ label: "Tigers", value: 2, state: "normal" },
				{ label: "Bears", value: 7, state: "normal" }
			],
			barColor: "#4285F4"
		},
		bar_chart_reading_visual: {
			type: "dataTable",
			title: "Bar Chart Reading Steps",
			columns: [
				{ key: "step", label: [{ type: "text", content: "Step" }], isNumeric: false },
				{ key: "action", label: [{ type: "text", content: "What to Do" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>1</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Find the bar for your team" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>2</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Look at the top of the bar" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>3</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Trace horizontally to the y-axis" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>4</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Read the number value" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "The Lions, Tigers, and Bears won baseball games last summer." }]
		},
		{
			type: "paragraph",
			content: [{ type: "text", content: "This bar graph shows how many games each team won." }]
		},
		{ type: "widgetRef", widgetId: "games_chart" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "How many games did the Lions win? " },
				{ type: "inlineInteractionRef", interactionId: "text_entry" }
			]
		}
	],
	interactions: {
		text_entry: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE",
			expectedLength: 3
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! You correctly read that the Lions won " },
						{ type: "math", mathml: "<mn>14</mn>" },
						{ type: "text", content: " games by looking at where their bar reaches on the vertical axis." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated excellent bar chart reading skills! You found the Lions bar and traced it up to see that it reaches the " },
						{ type: "math", mathml: "<mn>14</mn>" },
						{ type: "text", content: " mark on the \"Games Won\" axis." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Bar charts are everywhere in real life - sports statistics, sales reports, weather data, and survey results. This skill will help you interpret data throughout your life!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Fun fact: The Lions won " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " times more games than the Tigers and exactly " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " times more than the Bears!" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's read this bar chart together step by step! Bar charts show data by the height of each bar." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Find the Lions bar. Look along the bottom (x-axis) for \"Lions\" and find their bar." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Follow the top of the Lions bar horizontally to the left until you reach the vertical axis (y-axis)." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Read the number where the bar height meets the \"Games Won\" axis. This should be " },
						{ type: "math", mathml: "<mn>14</mn>" },
						{ type: "text", content: "." }
					]
				},
				{ type: "widgetRef", widgetId: "bar_chart_reading_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Memory tip: Always trace from the data to the axis - don't guess by eye!" }
					]
				}
			]
		}
	]
}

export const dollHeightLinePlot: AssessmentItemInput = {
	identifier: "doll-height-line-plot",
	title: "Interpreting a line plot",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "integer",
			correct: 5
		}
	],
	widgets: {
		doll_plot: {
			type: "dotPlot",
			width: 350,
			height: 300,
			axis: {
				label: "Doll Height (centimeters)",
				min: 20,
				max: 25,
				tickInterval: 1
			},
			data: [
				{ value: 21, count: 1 },
				{ value: 22, count: 2 },
				{ value: 23, count: 3 },
				{ value: 24, count: 2 }
			],
			dotColor: "#333333",
			dotRadius: 6
		},
		dot_plot_reading_visual: {
			type: "dataTable",
			title: "Dot Plot Reading Guide",
			columns: [
				{ key: "height", label: [{ type: "text", content: "Height (cm)" }], isNumeric: true },
				{ key: "dots", label: [{ type: "text", content: "Number of Dots" }], isNumeric: true },
				{ key: "taller_than_22", label: [{ type: "text", content: "Taller than 22?" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>21</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>1</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "No" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>22</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>2</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "No" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>23</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>3</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Yes" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>24</mn>" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>2</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "Yes" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "The heights of Sabrina's dolls are shown below." }]
		},
		{ type: "widgetRef", widgetId: "doll_plot" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "How many dolls are taller than " },
				{ type: "math", mathml: "<mn>22</mn>" },
				{ type: "text", content: " centimeters? " },
				{ type: "inlineInteractionRef", interactionId: "text_entry" }
			]
		}
	],
	interactions: {
		text_entry: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE",
			expectedLength: 3
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly found that " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " dolls are taller than " },
						{ type: "math", mathml: "<mn>22</mn><mtext> cm</mtext>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated great understanding of how to read dot plots! You correctly identified that \"taller than " },
						{ type: "math", mathml: "<mn>22</mn>" },
						{ type: "text", content: " cm\" means looking at positions " },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mn>24</mn>" },
						{ type: "text", content: " cm." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Your counting was perfect: " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " dots at " },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " cm + " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " dots at " },
						{ type: "math", mathml: "<mn>24</mn>" },
						{ type: "text", content: " cm = " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " dolls total." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This skill of reading data from dot plots is essential for understanding surveys, scientific data, and statistical analysis!" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's read this dot plot together step by step! Dot plots can be tricky, but there's a clear method." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Understand what \"taller than " },
						{ type: "math", mathml: "<mn>22</mn>" },
						{ type: "text", content: " cm\" means. This means heights greater than " },
						{ type: "math", mathml: "<mn>22</mn>" },
						{ type: "text", content: ", so we look at " },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " cm and " },
						{ type: "math", mathml: "<mn>24</mn>" },
						{ type: "text", content: " cm." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Count dots at each position:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• At " },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " cm: " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " dots (count them vertically!)" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• At " },
						{ type: "math", mathml: "<mn>24</mn>" },
						{ type: "text", content: " cm: " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " dots" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Add them up: " },
						{ type: "math", mathml: "<mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn>" },
						{ type: "text", content: " dolls are taller than " },
						{ type: "math", mathml: "<mn>22</mn>" },
						{ type: "text", content: " cm." }
					]
				},
				{ type: "widgetRef", widgetId: "dot_plot_reading_visual" }
			]
		}
	]
}

export const timeOnNumberLine: AssessmentItemInput = {
	identifier: "time-on-number-line-detailed-final",
	title: "What time is shown on the number line?",
	responseDeclarations: [
		{ identifier: "RESPONSE_HR", cardinality: "single", baseType: "integer", correct: 12 },
		{ identifier: "RESPONSE_MIN", cardinality: "single", baseType: "integer", correct: 55 }
	],
	widgets: {
		time_line: {
			type: "numberLine",
			width: 500,
			height: 300,
			orientation: "horizontal",
			min: 0,
			max: 60,
			tickInterval: { type: "whole", interval: 15 },
			secondaryTickInterval: { type: "whole", interval: 1 },
			showTickLabels: true,
			highlightedPoints: [{ type: "whole", position: 55, value: 55, sign: "+", color: "#A0522D", style: "dot" }],
			segments: null,
			model: null
		},
		time_number_line_visual: {
			type: "numberLine",
			width: 400,
			height: 300,
			orientation: "horizontal",
			min: 0,
			max: 60,
			tickInterval: { type: "whole", interval: 15 },
			secondaryTickInterval: { type: "whole", interval: 5 },
			showTickLabels: true,
			highlightedPoints: [
				{ type: "whole", position: 55, value: 55, sign: "+", color: "#FF6B6B", style: "dot" }
			],
			segments: null,
			model: null
		}
	},
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "Look at the following number line." }]
		},
		{ type: "widgetRef", widgetId: "time_line" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "What time is shown on the number line? " },
				{ type: "inlineInteractionRef", interactionId: "hour_entry" },
				{ type: "text", content: ":" },
				{ type: "inlineInteractionRef", interactionId: "minute_entry" }
			]
		}
	],
	interactions: {
		hour_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_HR", expectedLength: 2 },
		minute_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_MIN", expectedLength: 2 }
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly read the time as " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: ":" },
						{ type: "math", mathml: "<mn>55</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You understood that the point is positioned at " },
						{ type: "math", mathml: "<mn>55</mn>" },
						{ type: "text", content: " minutes on the number line, which represents " },
						{ type: "math", mathml: "<mn>55</mn>" },
						{ type: "text", content: " minutes after " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: " o'clock." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This shows great understanding of how time works! " },
						{ type: "math", mathml: "<mn>55</mn>" },
						{ type: "text", content: " minutes means we're " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " minutes away from the next hour (" },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ":00)." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Reading time on number lines helps you understand elapsed time, scheduling, and time intervals - skills you use every day!" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's read this time number line together! Number lines for time work just like regular number lines, but with time units." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Identify the hour. The number line shows minutes from " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " to " },
						{ type: "math", mathml: "<mn>60</mn>" },
						{ type: "text", content: ", representing one hour starting at " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: ":00." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Find where the point is located. The point is at position " },
						{ type: "math", mathml: "<mn>55</mn>" },
						{ type: "text", content: " on the number line." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Convert to time format. Position " },
						{ type: "math", mathml: "<mn>55</mn>" },
						{ type: "text", content: " means " },
						{ type: "math", mathml: "<mn>55</mn>" },
						{ type: "text", content: " minutes after " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: ":00, which is " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: ":" },
						{ type: "math", mathml: "<mn>55</mn>" },
						{ type: "text", content: "." }
					]
				},
				{ type: "widgetRef", widgetId: "time_number_line_visual" }
			]
		}
	]
}

export const compare2DigitNumbers: AssessmentItemInput = {
	identifier: "compare-2-digit-numbers",
	title: "Compare 2-digit numbers",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "identifier",
			correct: "GT"
		}
	],
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "Compare using >, <, or =." }]
		},
		{
			type: "paragraph",
			content: [
				{ type: "math", mathml: "<mn>83</mn>" },
				{ type: "text", content: " " },
				{ type: "inlineInteractionRef", interactionId: "comparison" },
				{ type: "text", content: " " },
				{ type: "math", mathml: "<mn>58</mn>" }
			]
		}
	],
	interactions: {
		comparison: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			choices: [
				{
					identifier: "GT",
					content: [{ type: "math", mathml: "<mo>&gt;</mo>" }]
				},
				{
					identifier: "LT",
					content: [{ type: "math", mathml: "<mo>&lt;</mo>" }]
				},
				{
					identifier: "EQ",
					content: [{ type: "math", mathml: "<mo>=</mo>" }]
				}
			]
		}
	},
	widgets: null,
	feedbackBlocks: [
		{
			identifier: "GT",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly identified that " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " is greater than " },
						{ type: "math", mathml: "<mn>58</mn>" },
						{ type: "text", content: ", so the correct symbol is " },
						{ type: "math", mathml: "<mo>&gt;</mo>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You used place value thinking perfectly! " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " has " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " tens, while " },
						{ type: "math", mathml: "<mn>58</mn>" },
						{ type: "text", content: " has only " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " tens, making " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " the larger number." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The > symbol always \"points\" toward the smaller number, like an arrow showing which way to go!" }
					]
				}
			]
		},
		{
			identifier: "LT",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's compare these numbers using place value! This is a systematic way to never make mistakes." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Compare the tens place first. " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " has " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " tens, " },
						{ type: "math", mathml: "<mn>58</mn>" },
						{ type: "text", content: " has " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " tens." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Since " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " > " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: ", we know " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " > " },
						{ type: "math", mathml: "<mn>58</mn>" },
						{ type: "text", content: " without even looking at the ones place!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The correct comparison is " },
						{ type: "math", mathml: "<mn>83</mn><mo>&gt;</mo><mn>58</mn>" },
						{ type: "text", content: " (not " },
						{ type: "math", mathml: "<mn>83</mn><mo>&lt;</mo><mn>58</mn>" },
						{ type: "text", content: ")." }
					]
				}
			]
		},
		{
			identifier: "EQ",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "These numbers look similar, but they're not equal! Let's examine them digit by digit." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Breaking down the numbers:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " tens + " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " ones" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• " },
						{ type: "math", mathml: "<mn>58</mn>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " tens + " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " ones" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Since " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " tens ≠ " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " tens, these numbers are not equal. The correct comparison is " },
						{ type: "math", mathml: "<mn>83</mn><mo>&gt;</mo><mn>58</mn>" },
						{ type: "text", content: "." }
					]
				}
			]
		}
	]
}

export const greatestCommonFactor: AssessmentItemInput = {
	identifier: "greatest-common-factor-numeric-input",
	title: "Greatest common factor",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "single",
			baseType: "integer",
			correct: 15
		}
	],
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "Find the greatest common factor of " },
				{ type: "math", mathml: "<mn>30</mn>" },
				{ type: "text", content: " and " },
				{ type: "math", mathml: "<mn>75</mn>" },
				{ type: "text", content: "." }
			]
		},
		{ type: "interactionRef", interactionId: "text_entry_interaction_1" }
	],
	interactions: {
		text_entry_interaction_1: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE",
			expectedLength: 3
		}
	},
	widgets: {
		gcf_application_visual: {
			type: "fractionModelDiagram",
			width: 400,
			height: 300,
			shapeType: "box",
			shapes: [
				{
					numerator: 2,
					denominator: 5,
					color: "#4285F4"
				}
			],
			operators: null
		},
		factor_listing_visual: {
			type: "dataTable",
			title: "Factor Comparison",
			columns: [
				{ key: "number", label: [{ type: "text", content: "Number" }], isNumeric: false },
				{ key: "factors", label: [{ type: "text", content: "All Factors" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>30</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "1, 2, 3, 5, 6, 10, 15, 30" }] }
				],
				[
					{ type: "inline", content: [{ type: "math", mathml: "<mn>75</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "1, 3, 5, 15, 25, 75" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Common" }] },
					{ type: "inline", content: [{ type: "text", content: "1, 3, 5, 15" }] }
				]
			],
			footer: []
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Outstanding! You correctly found that the greatest common factor of " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mn>75</mn>" },
						{ type: "text", content: " is " },
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You found the largest number that divides evenly into both numbers! " },
						{ type: "math", mathml: "<mn>30</mn><mo>÷</mo><mn>15</mn><mo>=</mo><mn>2</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mn>75</mn><mo>÷</mo><mn>15</mn><mo>=</mo><mn>5</mn>" },
						{ type: "text", content: " with no remainders." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Understanding GCF is essential for simplifying fractions! For example, " },
						{ type: "math", mathml: "<mfrac><mn>30</mn><mn>75</mn></mfrac>" },
						{ type: "text", content: " simplifies to " },
						{ type: "math", mathml: "<mfrac><mn>2</mn><mn>5</mn></mfrac>" },
						{ type: "text", content: " by dividing both parts by " },
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: "." }
					]
				},
				{ type: "widgetRef", widgetId: "gcf_application_visual" }
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's find the GCF step by step! There are several methods, but listing factors is very reliable." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": List all factors of " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: ":" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Factors of " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: ": " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>6</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>10</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>30</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": List all factors of " },
						{ type: "math", mathml: "<mn>75</mn>" },
						{ type: "text", content: ":" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Factors of " },
						{ type: "math", mathml: "<mn>75</mn>" },
						{ type: "text", content: ": " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>25</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>75</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Find common factors: " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>15</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The greatest (largest) common factor is " },
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: "!" }
					]
				},
				{ type: "widgetRef", widgetId: "factor_listing_visual" }
			]
		}
	]
}

export const threeDataTablesMultipleChoice: AssessmentItemInput = {
	identifier: "three-data-tables-mc",
	title: "Read three different tables and answer three questions",
	responseDeclarations: [
		{ identifier: "RESPONSE_Q1", cardinality: "single", baseType: "identifier", correct: "B" },
		{ identifier: "RESPONSE_Q2", cardinality: "single", baseType: "identifier", correct: "C" },
		{ identifier: "RESPONSE_Q3", cardinality: "single", baseType: "identifier", correct: "C" }
	],
	widgets: {
		table_q1: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "fruit", label: [{ type: "text", content: "Fruit" }], isNumeric: false },
				{ key: "count", label: [{ type: "text", content: "Count" }], isNumeric: true }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Apples" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>12</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Bananas" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>8</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Cherries" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>4</mn>" }] }
				]
			],
			footer: []
		},
		table_q2: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "city", label: [{ type: "text", content: "City" }], isNumeric: false },
				{ key: "temp", label: [{ type: "text", content: "Temperature (°F)" }], isNumeric: true }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Springfield" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>72</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Riverton" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>65</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Lakeside" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>80</mn>" }] }
				]
			],
			footer: []
		},
		table_q3: {
			type: "dataTable",
			title: null,
			columns: [
				{ key: "subject", label: [{ type: "text", content: "Subject" }], isNumeric: false },
				{ key: "minutes", label: [{ type: "text", content: "Minutes studied" }], isNumeric: true }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "Math" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>45</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "Science" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>30</mn>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "History" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>15</mn>" }] }
				]
			],
			footer: []
		}
	},
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "For each table, answer the multiple choice question that follows." }]
		},
		{ type: "widgetRef", widgetId: "table_q1" },
		{ type: "interactionRef", interactionId: "choice_q1" },
		{ type: "widgetRef", widgetId: "table_q2" },
		{ type: "interactionRef", interactionId: "choice_q2" },
		{ type: "widgetRef", widgetId: "table_q3" },
		{ type: "interactionRef", interactionId: "choice_q3" }
	],
	interactions: {
		choice_q1: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE_Q1",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [{ type: "text", content: "Which fruit had the highest count?" }],
			choices: [
				{
					identifier: "A",
					content: [{ type: "paragraph", content: [{ type: "text", content: "Apples" }] }]
				},
				{
					identifier: "B",
					content: [{ type: "paragraph", content: [{ type: "text", content: "Bananas" }] }]
				},
				{
					identifier: "C",
					content: [{ type: "paragraph", content: [{ type: "text", content: "Cherries" }] }]
				}
			]
		},
		choice_q2: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE_Q2",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [{ type: "text", content: "Which city had the lowest temperature?" }],
			choices: [
				{
					identifier: "A",
					content: [{ type: "paragraph", content: [{ type: "text", content: "Springfield" }] }]
				},
				{
					identifier: "B",
					content: [{ type: "paragraph", content: [{ type: "text", content: "Riverton" }] }]
				},
				{
					identifier: "C",
					content: [{ type: "paragraph", content: [{ type: "text", content: "Lakeside" }] }]
				}
			]
		},
		choice_q3: {
			type: "choiceInteraction",
			responseIdentifier: "RESPONSE_Q3",
			shuffle: true,
			minChoices: 1,
			maxChoices: 1,
			prompt: [{ type: "text", content: "Which subject shows 30 minutes studied?" }],
			choices: [
				{
					identifier: "A",
					content: [{ type: "paragraph", content: [{ type: "text", content: "Math" }] }]
				},
				{
					identifier: "B",
					content: [{ type: "paragraph", content: [{ type: "text", content: "Science" }] }]
				},
				{
					identifier: "C",
					content: [{ type: "paragraph", content: [{ type: "text", content: "History" }] }]
				}
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q1",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's look at the fruit table together! Reading data tables requires careful attention to both the labels and numbers." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Looking at the counts: Apples = " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: ", Bananas = " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: ", Cherries = " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: ". The highest count is " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: " (Apples), not " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " (Bananas)." }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q1",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent! You correctly identified that Apples had the highest count with " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: " fruits." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You compared all three values (" },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: ") and correctly identified the maximum. This is exactly how data analysis works!" }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q1",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's examine the fruit counts more carefully! Cherries had " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " fruits, but that's actually the lowest count, not the highest." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Compare all three: Apples = " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: ", Bananas = " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: ", Cherries = " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: ". The highest is " },
						{ type: "math", mathml: "<mn>12</mn>" },
						{ type: "text", content: " (Apples)." }
					]
				}
			]
		},

		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q2",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Springfield had " },
						{ type: "math", mathml: "<mn>72</mn>" },
						{ type: "text", content: "°F, but that's not the lowest temperature. Let's compare all three cities systematically." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Springfield: " },
						{ type: "math", mathml: "<mn>72</mn>" },
						{ type: "text", content: "°F, Riverton: " },
						{ type: "math", mathml: "<mn>65</mn>" },
						{ type: "text", content: "°F, Lakeside: " },
						{ type: "math", mathml: "<mn>80</mn>" },
						{ type: "text", content: "°F. The lowest is " },
						{ type: "math", mathml: "<mn>65</mn>" },
						{ type: "text", content: "°F (Riverton)." }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q2",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! Riverton had the lowest temperature at " },
						{ type: "math", mathml: "<mn>65</mn>" },
						{ type: "text", content: "°F." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You correctly compared all three temperatures and identified the minimum value. This is exactly how meteorologists analyze weather data!" }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q2",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Lakeside had " },
						{ type: "math", mathml: "<mn>80</mn>" },
						{ type: "text", content: "°F, which is actually the highest temperature, not the lowest!" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "When finding the lowest value, look for the smallest number: " },
						{ type: "math", mathml: "<mn>65</mn>" },
						{ type: "text", content: " < " },
						{ type: "math", mathml: "<mn>72</mn>" },
						{ type: "text", content: " < " },
						{ type: "math", mathml: "<mn>80</mn>" },
						{ type: "text", content: ". So Riverton (" },
						{ type: "math", mathml: "<mn>65</mn>" },
						{ type: "text", content: "°F) had the lowest temperature." }
					]
				}
			]
		},

		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q3",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Math shows " },
						{ type: "math", mathml: "<mn>45</mn>" },
						{ type: "text", content: " minutes studied, but we're looking for exactly " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " minutes." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Check the minutes column carefully: Math = " },
						{ type: "math", mathml: "<mn>45</mn>" },
						{ type: "text", content: ", Science = " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: ", History = " },
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: ". Science has exactly " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " minutes." }
					]
				}
			]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q3",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent! Science shows exactly " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " minutes studied." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You successfully found the exact match in the data table. This precision in reading tables is essential for research, budgeting, and data analysis!" }
					]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q3",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "History shows " },
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: " minutes, which is half of the " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " minutes we're looking for." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Look at the minutes column: Math = " },
						{ type: "math", mathml: "<mn>45</mn>" },
						{ type: "text", content: ", Science = " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: ", History = " },
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: ". Science has exactly " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " minutes." }
					]
				}
			]
		}
	]
}

export const gustaveStepsPerMile: AssessmentItemInput = {
	identifier: "gustave-steps-per-mile",
	title: "Write an equation and find steps per mile",
	responseDeclarations: [
		{ identifier: "RESPONSE_EQN", cardinality: "single", baseType: "string", correct: "3s=6300" },
		{ identifier: "RESPONSE_STEPS", cardinality: "single", baseType: "integer", correct: 2100 }
	],
	widgets: {
		gustave_shoe_image: {
			type: "emojiImage",
			emoji: "👟",
			size: 140
		},
		unit_rate_visual: {
			type: "tapeDiagram",
			width: 500,
			height: 300,
			referenceUnitsTotal: null,
			topTape: {
				label: "Unit Rate Visualization",
				unitsTotal: 2100,
				extent: null,
				grid: { show: true },
				roundedCaps: null,
				fills: [
					{ 
						span: { by: "units", startUnit: 0, endUnit: 2100 },
						style: { kind: "solid", fill: "#4285F4", fillOpacity: null },
						label: {
							text: "2100 steps",
							placement: "inside"
						}
					}
				]
			},
			bottomTape: null,
			brackets: [
				{
					span: { by: "units", startUnit: 0, endUnit: 2100 },
					tape: "top",
					labelTop: "1 mile",
					labelBottom: null,
					style: { kind: "straight", stroke: "#000000", strokeWidth: 2 }
				}
			]
		}
	},
	body: [
		{ type: "widgetRef", widgetId: "gustave_shoe_image" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "Gustave measured his pace and determined that for him, " },
				{ type: "math", mathml: "<mi>s</mi>" },
				{ type: "text", content: " steps make up one mile. One day Gustave walked " },
				{ type: "math", mathml: "<mn>6300</mn>" },
				{ type: "text", content: " steps, which was " },
				{ type: "math", mathml: "<mn>3</mn>" },
				{ type: "text", content: " miles." }
			]
		},
		{ type: "paragraph", content: [{ type: "text", content: "Write an equation to describe this situation." }] },
		{ type: "paragraph", content: [{ type: "inlineInteractionRef", interactionId: "equation_entry" }] },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "How many steps are in one mile for Gustave? " },
				{ type: "inlineInteractionRef", interactionId: "steps_entry" }
			]
		}
	],
	interactions: {
		equation_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_EQN", expectedLength: 7 },
		steps_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_STEPS", expectedLength: 4 }
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Outstanding work! You correctly wrote the equation " },
						{ type: "math", mathml: "<mn>3</mn><mi>s</mi><mo>=</mo><mn>6300</mn>" },
						{ type: "text", content: " and found that there are " },
						{ type: "math", mathml: "<mn>2100</mn>" },
						{ type: "text", content: " steps in one mile for Gustave." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You demonstrated excellent understanding of how to set up equations from word problems! You correctly identified that " },
						{ type: "math", mathml: "<mi>s</mi>" },
						{ type: "text", content: " represents steps per mile, and " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " miles × " },
						{ type: "math", mathml: "<mi>s</mi>" },
						{ type: "text", content: " steps/mile = " },
						{ type: "math", mathml: "<mn>6300</mn>" },
						{ type: "text", content: " total steps." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Your solution process was perfect: " },
						{ type: "math", mathml: "<mi>s</mi><mo>=</mo><mfrac><mn>6300</mn><mn>3</mn></mfrac><mo>=</mo><mn>2100</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This type of problem-solving is used everywhere: calculating unit rates, converting measurements, and analyzing proportional relationships in science and economics!" }
					]
				},
				{ type: "widgetRef", widgetId: "unit_rate_visual" }
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's work through this step by step! Word problems become much easier when you break them down systematically." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Define the variable. Let " },
						{ type: "math", mathml: "<mi>s</mi>" },
						{ type: "text", content: " = number of steps in one mile." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Set up the equation. If " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " miles = " },
						{ type: "math", mathml: "<mn>6300</mn>" },
						{ type: "text", content: " steps, then:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " miles × " },
						{ type: "math", mathml: "<mi>s</mi>" },
						{ type: "text", content: " steps/mile = " },
						{ type: "math", mathml: "<mn>6300</mn>" },
						{ type: "text", content: " steps" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "So the equation is: " },
						{ type: "math", mathml: "<mn>3</mn><mi>s</mi><mo>=</mo><mn>6300</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Solve for " },
						{ type: "math", mathml: "<mi>s</mi>" },
						{ type: "text", content: ": " },
						{ type: "math", mathml: "<mi>s</mi><mo>=</mo><mfrac><mn>6300</mn><mn>3</mn></mfrac><mo>=</mo><mn>2100</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Therefore, there are " },
						{ type: "math", mathml: "<mn>2100</mn>" },
						{ type: "text", content: " steps in one mile for Gustave." }
					]
				}
			]
		}
	]
}

export const compareNegativeDecimalVsRootInlineChoice: AssessmentItemInput = {
	body: [
		{ type: "paragraph", content: [{ type: "text", content: "Compare." }] },
		{
			type: "paragraph",
			content: [
				{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn>" },
				{ type: "text", content: " " },
				{ type: "inlineInteractionRef", interactionId: "comparison_dropdown" },
				{ type: "text", content: " " },
				{ type: "math", mathml: "<mo>-</mo><msqrt><mn>20</mn></msqrt>" }
			]
		}
	],
	title: "Compare a decimal and a square root",
	widgets: {},
	feedbackBlocks: [
		{
			identifier: "GT",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent work! You correctly determined that " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn>" },
						{ type: "text", content: " is greater than " },
						{ type: "math", mathml: "<mo>-</mo><msqrt><mn>20</mn></msqrt>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You understood that " },
						{ type: "math", mathml: "<msqrt><mn>20</mn></msqrt><mo>≈</mo><mn>4.47</mn>" },
						{ type: "text", content: ", so " },
						{ type: "math", mathml: "<mo>-</mo><msqrt><mn>20</mn></msqrt><mo>≈</mo><mo>-</mo><mn>4.47</mn>" },
						{ type: "text", content: ". Since " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn>" },
						{ type: "text", content: " is closer to zero than " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.47</mn>" },
						{ type: "text", content: ", it's the greater value." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This shows excellent understanding of both square roots and negative number comparison - advanced mathematical thinking!" }
					]
				}
			]
		},
		{
			identifier: "LT",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "I can see why this is tricky! Comparing negative numbers with square roots involves multiple steps." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Estimate " },
						{ type: "math", mathml: "<msqrt><mn>20</mn></msqrt>" },
						{ type: "text", content: ". Since " },
						{ type: "math", mathml: "<msup><mn>4</mn><mn>2</mn></msup><mo>=</mo><mn>16</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<msup><mn>5</mn><mn>2</mn></msup><mo>=</mo><mn>25</mn>" },
						{ type: "text", content: ", we know " },
						{ type: "math", mathml: "<mn>4</mn><mo>&lt;</mo><msqrt><mn>20</mn></msqrt><mo>&lt;</mo><mn>5</mn>" },
						{ type: "text", content: ". More precisely, " },
						{ type: "math", mathml: "<msqrt><mn>20</mn></msqrt><mo>≈</mo><mn>4.47</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Apply the negative sign: " },
						{ type: "math", mathml: "<mo>-</mo><msqrt><mn>20</mn></msqrt><mo>≈</mo><mo>-</mo><mn>4.47</mn>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Compare: " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn>" },
						{ type: "text", content: " vs " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.47</mn>" },
						{ type: "text", content: ". Since " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn>" },
						{ type: "text", content: " is closer to zero, " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn><mo>&gt;</mo><mo>-</mo><mn>4.47</mn>" },
						{ type: "text", content: "." }
					]
				}
			]
		},
		{
			identifier: "EQ",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "These values are close but not equal! Let's calculate to see the difference." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "First, let's find " },
						{ type: "math", mathml: "<msqrt><mn>20</mn></msqrt>" },
						{ type: "text", content: ". Since " },
						{ type: "math", mathml: "<mn>20</mn>" },
						{ type: "text", content: " is between " },
						{ type: "math", mathml: "<mn>16</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mn>25</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<msqrt><mn>20</mn></msqrt>" },
						{ type: "text", content: " is between " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: ". More precisely, " },
						{ type: "math", mathml: "<msqrt><mn>20</mn></msqrt><mo>≈</mo><mn>4.47</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "So we're comparing " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.47</mn>" },
						{ type: "text", content: ". Since " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn>" },
						{ type: "text", content: " is closer to zero, " },
						{ type: "math", mathml: "<mo>-</mo><mn>4.1</mn><mo>&gt;</mo><mo>-</mo><mn>4.47</mn>" },
						{ type: "text", content: "." }
					]
				}
			]
		}
	],
	identifier: "compare-negative-decimal-vs-root-inline-choice",
	interactions: {
		comparison_dropdown: {
			type: "inlineChoiceInteraction",
			choices: [
				{ content: [{ type: "text", content: "<" }], identifier: "LT" },
				{ content: [{ type: "text", content: ">" }], identifier: "GT" },
				{ content: [{ type: "text", content: "=" }], identifier: "EQ" }
			],
			shuffle: true,
			responseIdentifier: "RESPONSE"
		}
	},
	responseDeclarations: [{ correct: "GT", baseType: "identifier", identifier: "RESPONSE", cardinality: "single" }]
}

export const reactionRateChangesTable: AssessmentItemInput = {
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"Different situations call for chemical reactions that release energy quickly, such as an explosion, or slowly, such as a hand warmer."
				}
			]
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"To control how quickly energy is released or absorbed, we can make adjustments to change how fast the reaction occurs."
				}
			]
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content: "Complete the table to show how the reaction rate is typically affected by each change."
				}
			]
		},
		{
			type: "widgetRef",
			widgetId: "reaction_rate_table"
		}
	],
	title: "How changes affect the reaction rate",
	widgets: {
		reaction_rate_table: {
			data: [
				[
					{
						type: "inline",
						content: [
							{
								type: "text",
								content: "Stir the reactants"
							}
						]
					},
					{
						type: "dropdown",
						choices: [
							{
								content: [
									{
										type: "text",
										content: "increase"
									}
								],
								identifier: "INCREASE"
							},
							{
								content: [
									{
										type: "text",
										content: "decrease"
									}
								],
								identifier: "DECREASE"
							}
						],
						shuffle: false,
						responseIdentifier: "RESPONSE_DROPDOWN_1"
					}
				],
				[
					{
						type: "inline",
						content: [
							{
								type: "text",
								content: "Heat the reactants"
							}
						]
					},
					{
						type: "dropdown",
						choices: [
							{
								content: [
									{
										type: "text",
										content: "increase"
									}
								],
								identifier: "INCREASE"
							},
							{
								content: [
									{
										type: "text",
										content: "decrease"
									}
								],
								identifier: "DECREASE"
							}
						],
						shuffle: false,
						responseIdentifier: "RESPONSE_DROPDOWN_2"
					}
				],
				[
					{
						type: "inline",
						content: [
							{
								type: "text",
								content: "Decrease the concentration of the reactants"
							}
						]
					},
					{
						type: "dropdown",
						choices: [
							{
								content: [
									{
										type: "text",
										content: "increase"
									}
								],
								identifier: "INCREASE"
							},
							{
								content: [
									{
										type: "text",
										content: "decrease"
									}
								],
								identifier: "DECREASE"
							}
						],
						shuffle: false,
						responseIdentifier: "RESPONSE_DROPDOWN_3"
					}
				]
			],
			type: "dataTable",
			title: "How changes affect the reaction rate",
			footer: null,
			columns: [
				{
					key: "change",
					label: [
						{
							type: "text",
							content: "Change"
						}
					],
					isNumeric: false
				},
				{
					key: "effect",
					label: [
						{
							type: "text",
							content: "Effect on rate"
						}
					],
					isNumeric: false
				}
			],
			rowHeaderKey: "change"
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"Correct! Stirring and heating increase the frequency of effective collisions, so they increase the reaction rate. Decreasing concentration reduces collisions and decreases the rate."
						}
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"Not quite. Stirring and heating bring reactant particles into contact more often, which increases collisions and speeds up the reaction. Lowering the concentration leads to fewer collisions, which slows the reaction."
						}
					]
				}
			]
		}
	],
	identifier: "reaction-rate-changes-table",
	interactions: {
		text_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TEXT_ENTRY", expectedLength: 10 }
	},
	responseDeclarations: [
		{
			correct: "INCREASE",
			baseType: "identifier",
			identifier: "RESPONSE_DROPDOWN_1",
			cardinality: "single"
		},
		{
			correct: "INCREASE",
			baseType: "identifier",
			identifier: "RESPONSE_DROPDOWN_2",
			cardinality: "single"
		},
		{
			correct: "DECREASE",
			baseType: "identifier",
			identifier: "RESPONSE_DROPDOWN_3",
			cardinality: "single"
		},
		{ identifier: "RESPONSE_TEXT_ENTRY", cardinality: "single", baseType: "string", correct: "done" }
	]
}

export const kineticEnergyMassSpeedRelationships: AssessmentItemInput = {
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content: "A moving object's kinetic energy is related to its mass and speed."
				}
			]
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"The relationship between kinetic energy and mass for an object with constant speed is modeled by the graph below."
				}
			]
		},
		{
			type: "widgetRef",
			widgetId: "image_2"
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"The relationship between kinetic energy and speed for an object with constant mass is modeled by the graph below."
				}
			]
		},
		{
			type: "widgetRef",
			widgetId: "image_3"
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content: "Use the patterns on the graphs to complete the statements."
				}
			]
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content: "• The relationship between kinetic energy and mass is "
				},
				{
					type: "inlineInteractionRef",
					interactionId: "dropdown_1"
				},
				{
					type: "text",
					content: ". If an object's mass is cut in half while its speed stays the same, its kinetic energy becomes "
				},
				{
					type: "inlineInteractionRef",
					interactionId: "dropdown_3"
				},
				{
					type: "text",
					content: " its original value."
				}
			]
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content: "• The relationship between kinetic energy and speed is "
				},
				{
					type: "inlineInteractionRef",
					interactionId: "dropdown_2"
				},
				{
					type: "text",
					content: ". If an object's speed is cut in half while its mass stays the same, its kinetic energy becomes "
				},
				{
					type: "inlineInteractionRef",
					interactionId: "dropdown_5"
				},
				{
					type: "text",
					content: " its original value."
				}
			]
		}
	],
	title: "Kinetic energy relationships with mass and speed",
	widgets: {
		image_2: {
			type: "conceptualGraph",
			width: 300,
			height: 300,
			curveColor: "#333333",
			xAxisLabel: "mass",
			yAxisLabel: "kinetic energy",
			curvePoints: [
				{ x: 0, y: 0 },
				{ x: 10, y: 10 }
			],
			highlightPoints: [],
			highlightPointColor: "#555555",
			highlightPointRadius: 4
		},
		image_3: {
			type: "conceptualGraph",
			width: 300,
			height: 300,
			curveColor: "#333333",
			xAxisLabel: "speed",
			yAxisLabel: "kinetic energy",
			curvePoints: [
				{ x: 0, y: 0 },
				{ x: 2, y: 0.4 },
				{ x: 4, y: 1.6 },
				{ x: 6, y: 3.6 },
				{ x: 8, y: 6.4 },
				{ x: 10, y: 10 }
			],
			highlightPoints: [],
			highlightPointColor: "#555555",
			highlightPointRadius: 4
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"Correct! The mass–kinetic energy relationship is linear, so halving the mass (at constant speed) halves the kinetic energy."
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"The speed–kinetic energy relationship is nonlinear (quadratic), so halving the speed (at constant mass) reduces the kinetic energy to one-fourth of its original value."
						}
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"Not quite. On the first graph, the straight line shows a linear pattern: when mass is scaled by a factor, kinetic energy scales by the same factor at constant speed."
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"On the second graph, the curved shape indicates a nonlinear (quadratic) pattern: when speed is halved, kinetic energy becomes one-fourth of its original value at constant mass."
						}
					]
				}
			]
		}
	],
	identifier: "ke-mass-speed-relationships",
	interactions: {
		dropdown_1: {
			type: "inlineChoiceInteraction",
			choices: [
				{
					content: [
						{
							type: "text",
							content: "linear"
						}
					],
					identifier: "LINEAR"
				},
				{
					content: [
						{
							type: "text",
							content: "nonlinear"
						}
					],
					identifier: "NONLINEAR"
				}
			],
			shuffle: true,
			responseIdentifier: "RESPONSE_DROPDOWN_1"
		},
		dropdown_2: {
			type: "inlineChoiceInteraction",
			choices: [
				{
					content: [
						{
							type: "text",
							content: "linear"
						}
					],
					identifier: "LINEAR"
				},
				{
					content: [
						{
							type: "text",
							content: "nonlinear"
						}
					],
					identifier: "NONLINEAR"
				}
			],
			shuffle: true,
			responseIdentifier: "RESPONSE_DROPDOWN_2"
		},
		dropdown_3: {
			type: "inlineChoiceInteraction",
			choices: [
				{
					content: [
						{
							type: "text",
							content: "one-fourth"
						}
					],
					identifier: "ONE_FOURTH"
				},
				{
					content: [
						{
							type: "text",
							content: "one-half"
						}
					],
					identifier: "ONE_HALF"
				},
				{
					content: [
						{
							type: "text",
							content: "two times"
						}
					],
					identifier: "TWO_TIMES"
				},
				{
					content: [
						{
							type: "text",
							content: "four times"
						}
					],
					identifier: "FOUR_TIMES"
				}
			],
			shuffle: true,
			responseIdentifier: "RESPONSE_DROPDOWN_3"
		},
		dropdown_5: {
			type: "inlineChoiceInteraction",
			choices: [
				{
					content: [
						{
							type: "text",
							content: "one-fourth"
						}
					],
					identifier: "ONE_FOURTH"
				},
				{
					content: [
						{
							type: "text",
							content: "one-half"
						}
					],
					identifier: "ONE_HALF"
				},
				{
					content: [
						{
							type: "text",
							content: "two times"
						}
					],
					identifier: "TWO_TIMES"
				},
				{
					content: [
						{
							type: "text",
							content: "four times"
						}
					],
					identifier: "FOUR_TIMES"
				}
			],
			shuffle: true,
			responseIdentifier: "RESPONSE_DROPDOWN_5"
		},
		text_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TEXT_ENTRY", expectedLength: 10 }
	},
	responseDeclarations: [
		{
			correct: "LINEAR",
			baseType: "identifier",
			identifier: "RESPONSE_DROPDOWN_1",
			cardinality: "single"
		},
		{
			correct: "ONE_HALF",
			baseType: "identifier",
			identifier: "RESPONSE_DROPDOWN_3",
			cardinality: "single"
		},
		{
			correct: "NONLINEAR",
			baseType: "identifier",
			identifier: "RESPONSE_DROPDOWN_2",
			cardinality: "single"
		},
		{
			correct: "ONE_FOURTH",
			baseType: "identifier",
			identifier: "RESPONSE_DROPDOWN_5",
			cardinality: "single"
		},
		{ identifier: "RESPONSE_TEXT_ENTRY", cardinality: "single", baseType: "string", correct: "test" }
	]
}

export const reactantAmountsTempChangeTablePerseus: AssessmentItemInput = {
	body: [
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"Several students tested how the temperature changed when dissolving different solids in the same amount of water. The substances they tested were "
				},
				{
					type: "math",
					mathml:
						"<mrow><mi>Na</mi><msub><mi>C</mi><mn>2</mn></msub><msub><mi>H</mi><mn>3</mn></msub><msub><mi>O</mi><mn>2</mn></msub></mrow>"
				},
				{ type: "text", content: ", " },
				{ type: "math", mathml: "<mrow><mi>K</mi><mi>O</mi><mi>H</mi></mrow>" },
				{ type: "text", content: ", and " },
				{
					type: "math",
					mathml: "<mrow><mi>Ba</mi><msub><mrow><mo>(</mo><mi>OH</mi><mo>)</mo></mrow><mn>2</mn></msub></mrow>"
				},
				{ type: "text", content: "." }
			]
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"Only one student kept track of everyone's data. Unfortunately, their lab notebook got wet, and some of the labels were damaged."
				}
			]
		},
		{
			type: "widgetRef",
			widgetId: "image_1"
		},
		{
			type: "paragraph",
			content: [
				{
					type: "text",
					content:
						"Use the data provided to identify the reactant and amount that caused each temperature change. Each option is only used once."
				}
			]
		},
		{
			type: "widgetRef",
			widgetId: "react_temp_table"
		}
	],
	title: "Identify reactants and amounts from temperature changes",
	widgets: {
		image_1: {
			alt: "A diagram of the lab setup, including a flask with liquid and a thermometer inside, and a solid powder being poured in. Another flask is tipped over and has spilled onto a notebook on the lab desk.",
			url: "https://cdn.kastatic.org/ka-content-images/7bebb0e8fd90795225d76add80eb4c2d9d7d4f0d.jpg",
			type: "urlImage",
			width: 372,
			height: 300,
			caption: null,
			attribution: "Created with Chemix"
		},
		react_temp_table: {
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "A" }] },
					{
						type: "inline",
						content: [
							{
								type: "math",
								mathml:
									"<mrow><mi>Na</mi><msub><mi>C</mi><mn>2</mn></msub><msub><mi>H</mi><mn>3</mn></msub><msub><mi>O</mi><mn>2</mn></msub></mrow>"
							}
						]
					},
					{
						type: "inline",
						content: [
							{ type: "math", mathml: "<mn>4.0</mn>" },
							{ type: "text", content: " grams" }
						]
					},
					{ type: "inline", content: [{ type: "math", mathml: "<mo>-</mo><mn>1.6</mn><mo>°</mo><mi>C</mi>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "B" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mrow><mi>K</mi><mi>O</mi><mi>H</mi></mrow>" }] },
					{
						type: "inline",
						content: [
							{ type: "math", mathml: "<mn>3.0</mn>" },
							{ type: "text", content: " grams" }
						]
					},
					{ type: "inline", content: [{ type: "math", mathml: "<mo>+</mo><mn>2.1</mn><mo>°</mo><mi>C</mi>" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "C" }] },
					{
						type: "inline",
						content: [
							{
								type: "math",
								mathml:
									"<mrow><mi>Na</mi><msub><mi>C</mi><mn>2</mn></msub><msub><mi>H</mi><mn>3</mn></msub><msub><mi>O</mi><mn>2</mn></msub></mrow>"
							}
						]
					},
					{
						type: "inline",
						content: [
							{ type: "math", mathml: "<mn>8.0</mn>" },
							{ type: "text", content: " grams" }
						]
					},
					{
						type: "dropdown",
						choices: [
							{
								content: [{ type: "math", mathml: "<mo>-</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "NEG_3_2_C"
							},
							{
								content: [{ type: "math", mathml: "<mo>+</mo><mn>2.0</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "POS_2_0_C"
							},
							{
								content: [{ type: "math", mathml: "<mo>+</mo><mn>4.2</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "POS_4_2_C"
							}
						],
						shuffle: false,
						responseIdentifier: "RESPONSE_DROPDOWN_13"
					}
				],
				[
					{ type: "inline", content: [{ type: "text", content: "D" }] },
					{
						type: "dropdown",
						choices: [
							{
								content: [
									{
										type: "math",
										mathml:
											"<mrow><mi>Na</mi><msub><mi>C</mi><mn>2</mn></msub><msub><mi>H</mi><mn>3</mn></msub><msub><mi>O</mi><mn>2</mn></msub></mrow>"
									}
								],
								identifier: "NAC2H3O2"
							},
							{ content: [{ type: "math", mathml: "<mrow><mi>K</mi><mi>O</mi><mi>H</mi></mrow>" }], identifier: "KOH" },
							{
								content: [
									{
										type: "math",
										mathml:
											"<mrow><mi>Ba</mi><msub><mrow><mo>(</mo><mi>OH</mi><mo>)</mo></mrow><mn>2</mn></msub></mrow>"
									}
								],
								identifier: "BAOH2"
							}
						],
						shuffle: false,
						responseIdentifier: "RESPONSE_DROPDOWN_9"
					},
					{
						type: "inline",
						content: [
							{ type: "math", mathml: "<mn>6.0</mn>" },
							{ type: "text", content: " grams" }
						]
					},
					{
						type: "dropdown",
						choices: [
							{
								content: [{ type: "math", mathml: "<mo>-</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "NEG_3_2_C"
							},
							{
								content: [{ type: "math", mathml: "<mo>+</mo><mn>2.0</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "POS_2_0_C"
							},
							{
								content: [{ type: "math", mathml: "<mo>+</mo><mn>4.2</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "POS_4_2_C"
							}
						],
						shuffle: false,
						responseIdentifier: "RESPONSE_DROPDOWN_12"
					}
				],
				[
					{ type: "inline", content: [{ type: "text", content: "E" }] },
					{
						type: "dropdown",
						choices: [
							{
								content: [
									{
										type: "math",
										mathml:
											"<mrow><mi>Na</mi><msub><mi>C</mi><mn>2</mn></msub><msub><mi>H</mi><mn>3</mn></msub><msub><mi>O</mi><mn>2</mn></msub></mrow>"
									}
								],
								identifier: "NAC2H3O2"
							},
							{ content: [{ type: "math", mathml: "<mrow><mi>K</mi><mi>O</mi><mi>H</mi></mrow>" }], identifier: "KOH" },
							{
								content: [
									{
										type: "math",
										mathml:
											"<mrow><mi>Ba</mi><msub><mrow><mo>(</mo><mi>OH</mi><mo>)</mo></mrow><mn>2</mn></msub></mrow>"
									}
								],
								identifier: "BAOH2"
							}
						],
						shuffle: false,
						responseIdentifier: "RESPONSE_DROPDOWN_10"
					},
					{
						type: "inline",
						content: [
							{ type: "math", mathml: "<mn>2.0</mn>" },
							{ type: "text", content: " grams" }
						]
					},
					{
						type: "dropdown",
						choices: [
							{
								content: [{ type: "math", mathml: "<mo>-</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "NEG_3_2_C"
							},
							{
								content: [{ type: "math", mathml: "<mo>+</mo><mn>2.0</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "POS_2_0_C"
							},
							{
								content: [{ type: "math", mathml: "<mo>+</mo><mn>4.2</mn><mo>°</mo><mi>C</mi>" }],
								identifier: "POS_4_2_C"
							}
						],
						shuffle: false,
						responseIdentifier: "RESPONSE_DROPDOWN_11"
					}
				]
			],
			type: "dataTable",
			title: "Experiment data",
			footer: null,
			columns: [
				{ key: "experiment", label: [{ type: "text", content: "Experiment" }], isNumeric: false },
				{ key: "reactant", label: [{ type: "text", content: "Reactant" }], isNumeric: false },
				{ key: "amount", label: [{ type: "text", content: "Amount of reactant" }], isNumeric: false },
				{ key: "temp_change", label: [{ type: "text", content: "Temperature change" }], isNumeric: false }
			],
			rowHeaderKey: "experiment"
		},
		reaction_pattern_visual: {
			type: "dataTable",
			title: "Reaction Pattern Analysis",
			columns: [
				{ key: "experiment", label: [{ type: "text", content: "Experiment" }], isNumeric: false },
				{ key: "compound", label: [{ type: "text", content: "Compound" }], isNumeric: false },
				{ key: "amount", label: [{ type: "text", content: "Amount (g)" }], isNumeric: true },
				{ key: "temp_change", label: [{ type: "text", content: "Temp Change" }], isNumeric: false },
				{ key: "pattern", label: [{ type: "text", content: "Pattern" }], isNumeric: false }
			],
			rowHeaderKey: null,
			data: [
				[
					{ type: "inline", content: [{ type: "text", content: "A" }] },
					{ type: "inline", content: [{ type: "text", content: "NaC₂H₃O₂" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>4.0</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "-1.6°C" }] },
					{ type: "inline", content: [{ type: "text", content: "Base case" }] }
				],
				[
					{ type: "inline", content: [{ type: "text", content: "C" }] },
					{ type: "inline", content: [{ type: "text", content: "NaC₂H₃O₂" }] },
					{ type: "inline", content: [{ type: "math", mathml: "<mn>8.0</mn>" }] },
					{ type: "inline", content: [{ type: "text", content: "-3.2°C" }] },
					{ type: "inline", content: [{ type: "text", content: "2× amount = 2× effect" }] }
				]
			],
			footer: []
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent detective work! You successfully used the patterns in the data to match each unknown entry." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You recognized the key relationships:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Experiment C has " },
						{ type: "math", mathml: "<mn>8.0</mn>" },
						{ type: "text", content: " grams of " },
						{ type: "math", mathml: "<mrow><mi>Na</mi><msub><mi>C</mi><mn>2</mn></msub><msub><mi>H</mi><mn>3</mn></msub><msub><mi>O</mi><mn>2</mn></msub></mrow>" },
						{ type: "text", content: " (twice experiment A's " },
						{ type: "math", mathml: "<mn>4.0</mn>" },
						{ type: "text", content: " grams), so its temperature change is twice as large: " },
						{ type: "math", mathml: "<mo>-</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Experiment D uses " },
						{ type: "math", mathml: "<mrow><mi>K</mi><mi>O</mi><mi>H</mi></mrow>" },
						{ type: "text", content: " (which causes heating) with temperature increase " },
						{ type: "math", mathml: "<mo>+</mo><mn>4.2</mn><mo>°</mo><mi>C</mi>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "• Experiment E uses " },
						{
							type: "math",
							mathml: "<mrow><mi>Ba</mi><msub><mrow><mo>(</mo><mi>OH</mi><mo>)</mo></mrow><mn>2</mn></msub></mrow>"
						},
						{ type: "text", content: " with temperature increase " },
						{ type: "math", mathml: "<mo>+</mo><mn>2.0</mn><mo>°</mo><mi>C</mi>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This type of pattern recognition is essential in chemistry for predicting reaction outcomes and understanding how concentration affects reaction intensity!" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This is challenging! Let's approach it systematically by looking for patterns in the data." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>1</mn>" },
						{ type: "text", content: ": Identify reaction types. Temperature decreases = endothermic (absorbs heat), temperature increases = exothermic (releases heat)." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ": Look for amount patterns. Experiment A uses " },
						{ type: "math", mathml: "<mn>4.0</mn>" },
						{ type: "text", content: " g " },
						{ type: "math", mathml: "<mrow><mi>Na</mi><msub><mi>C</mi><mn>2</mn></msub><msub><mi>H</mi><mn>3</mn></msub><msub><mi>O</mi><mn>2</mn></msub></mrow>" },
						{ type: "text", content: " → " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.6</mn><mo>°</mo><mi>C</mi>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Step " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: ": Use proportional reasoning. If " },
						{ type: "math", mathml: "<mn>8.0</mn>" },
						{ type: "text", content: " g is twice " },
						{ type: "math", mathml: "<mn>4.0</mn>" },
						{ type: "text", content: " g, then the temperature change should be twice as large: " },
						{ type: "math", mathml: "<mn>2</mn><mo>×</mo><mo>(</mo><mo>-</mo><mn>1.6</mn><mo>)</mo><mo>=</mo><mo>-</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" }
					]
				},
				{ type: "widgetRef", widgetId: "reaction_pattern_visual" },
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This pattern recognition helps chemists predict how changing concentrations will affect reaction outcomes!" }
					]
				}
			]
		}
	],
	identifier: "reactant-amounts-temp-change-table-perseus",
	interactions: {
		text_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TEXT_ENTRY", expectedLength: 10 }
	},
	responseDeclarations: [
		{ correct: "NEG_3_2_C", baseType: "identifier", identifier: "RESPONSE_DROPDOWN_13", cardinality: "single" },
		{ correct: "POS_4_2_C", baseType: "identifier", identifier: "RESPONSE_DROPDOWN_12", cardinality: "single" },
		{ correct: "POS_2_0_C", baseType: "identifier", identifier: "RESPONSE_DROPDOWN_11", cardinality: "single" },
		{ correct: "KOH", baseType: "identifier", identifier: "RESPONSE_DROPDOWN_9", cardinality: "single" },
		{ correct: "BAOH2", baseType: "identifier", identifier: "RESPONSE_DROPDOWN_10", cardinality: "single" },
		{ identifier: "RESPONSE_TEXT_ENTRY", cardinality: "single", baseType: "string", correct: "done" }
	]
}

export const allExamples: AssessmentItemInput[] = [
	probabilityNotPurpleSpinner,
	linearModelEquationPrediction,
	greatestCommonFactor,
	doubleNumberLineRatio,
	evalFractionalExponents,
	compare3DigitNumbers,
	inequalityNumberLine,
	verticalNumberLineComparison,
	twoWayFrequencyTable,
	equivalentFractionImages,
	calculateShadedArea,
	circleEquationCenterRadius,
	harukaExamScore,
	libertyvilleBusinessCycle,
	continuityDifferentiabilityPiecewise,
	stokesTheoremRewrite,
	estimateDerivativeFromTable,
	countApplesEmoji,
	shapeBinBarChart,
	pencilLengthLinePlot,
	gamesWonBarChart,
	dollHeightLinePlot,
	timeOnNumberLine,
	compare2DigitNumbers,
	threeDataTablesMultipleChoice,
	gustaveStepsPerMile,
	compareNegativeDecimalVsRootInlineChoice,
	reactantAmountsTemperatureTableWithDropdowns,
	attractRepelCompletionTable,
	reactionRateChangesTable,
	kineticEnergyMassSpeedRelationships,
	reactantAmountsTempChangeTablePerseus
]
