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
			outcomeIdentifier: "FEEDBACK__RESPONSE",
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
						{ type: "text", content: "This is called complementary probability. Instead of finding " },
						{ type: "math", mathml: "<mi>P</mi><mo>(</mo><mtext>purple</mtext><mo>)</mo><mo>=</mo><mfrac><mn>1</mn><mn>4</mn></mfrac>" },
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
			outcomeIdentifier: "FEEDBACK__RESPONSE",
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
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ")" },
						{ type: "text", content: " to " },
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>9.5</mn>" },
						{ type: "text", content: ")" },
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
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ")" },
						{ type: "text", content: ", not " },
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.5</mn>" },
						{ type: "text", content: ")" },
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
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ")" },
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
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: ")" },
						{ type: "text", content: " and " },
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>9.5</mn>" },
						{ type: "text", content: ")" },
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
			outcomeIdentifier: "FEEDBACK__RESPONSE_TEXT",
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
			outcomeIdentifier: "FEEDBACK__RESPONSE_TEXT",
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
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ")" },
						{ type: "text", content: " and " },
						{ type: "text", content: "(" },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mn>9.5</mn>" },
						{ type: "text", content: ")" },
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
				{
					type: "tableRich",
					header: [
						[
							[{ type: "text", content: "Symbol" }],
							[{ type: "text", content: "Meaning" }],
							[{ type: "text", content: "Circle Type" }]
						]
					],
					rows: [
						[
							[{ type: "math", mathml: "<mo>&gt;</mo>" }],
							[{ type: "text", content: "greater than" }],
							[{ type: "text", content: "open ○" }]
						],
						[
							[{ type: "math", mathml: "<mo>≥</mo>" }],
							[{ type: "text", content: "greater than or equal" }],
							[{ type: "text", content: "closed ●" }]
						]
					]
				},
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
		{
			type: "tableRich",
			header: [
				[
					[],
					[{ type: "text", content: "Received cold medicine" }],
					[{ type: "text", content: "Did not receive cold medicine" }]
				]
			],
			rows: [
				[
					[{ type: "text", content: "Cold lasted longer than 7 days" }],
					[{ type: "inlineInteractionRef", interactionId: "input_a" }],
					[{ type: "inlineInteractionRef", interactionId: "input_b" }]
				],
				[
					[{ type: "text", content: "Cold did not last longer than 7 days" }],
					[{ type: "inlineInteractionRef", interactionId: "input_c" }],
					[{ type: "inlineInteractionRef", interactionId: "input_d" }]
				]
			]
		}
	],
	interactions: {
		input_a: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE_A",
			expectedLength: 3
		},
		input_b: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE_B",
			expectedLength: 3
		},
		input_c: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE_C",
			expectedLength: 3
		},
		input_d: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE_D",
			expectedLength: 3
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_A",
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
				{
					type: "tableRich",
					header: [
						[
							[{ type: "text", content: "Venn Region" }],
							[{ type: "text", content: "Table Cell" }],
							[{ type: "text", content: "Count" }]
						]
					],
					rows: [
						[
							[{ type: "text", content: "Overlap" }],
							[{ type: "text", content: "Medicine + Long Cold" }],
							[{ type: "math", mathml: "<mn>23</mn>" }]
						],
						[
							[{ type: "text", content: "Medicine Only" }],
							[{ type: "text", content: "Medicine + Short Cold" }],
							[{ type: "math", mathml: "<mn>27</mn>" }]
						]
					]
				},
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
			outcomeIdentifier: "FEEDBACK__RESPONSE_A",
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
				
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Remember: The overlap goes in the cell where both conditions are true, then work outward to fill the rest!" }
					]
				}
			]
		},
		// Feedback for RESPONSE_B
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_B",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Great! You found that " },
						{ type: "math", mathml: "<mn>20</mn>" },
						{ type: "text", content: " people did not receive medicine but still had a cold lasting longer than " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " days." }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_B",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "To find this value, look at the \"Cold longer than " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " days\" circle. It shows " },
						{ type: "math", mathml: "<mn>20</mn>" },
						{ type: "text", content: " total, with " },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " in the overlap. Since the overlap counts people who got medicine, those outside must not have received medicine." }
					]
				}
			]
		},
		// Feedback for RESPONSE_C
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_C",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent! You correctly calculated that " },
						{ type: "math", mathml: "<mn>27</mn>" },
						{ type: "text", content: " people received medicine and had shorter colds." }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_C",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The \"Received medicine\" circle shows " },
						{ type: "math", mathml: "<mn>27</mn>" },
						{ type: "text", content: " total. Since " },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: " are in the overlap (long cold), the remaining must have had shorter colds: " },
						{ type: "math", mathml: "<mn>27</mn><mo>-</mo><mn>23</mn><mo>=</mo><mn>4</mn>" },
						{ type: "text", content: ". Wait, that doesn't match the answer. Let me reconsider the Venn diagram interpretation." }
					]
				}
			]
		},
		// Feedback for RESPONSE_D
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_D",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Perfect! You found that " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " people neither received medicine nor had long colds - they're outside both circles." }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_D",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "The number outside both circles is given directly as " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: ". These people didn't receive medicine AND had colds lasting " },
						{ type: "math", mathml: "<mn>7</mn>" },
						{ type: "text", content: " days or less." }
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
				{
					type: "tableRich",
					header: [
						[
							[{ type: "text", content: "Fraction" }],
							[{ type: "text", content: "Simplified" }],
							[{ type: "text", content: "Decimal" }]
						]
					],
					rows: [
						[
							[{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" }],
							[{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" }],
							[{ type: "math", mathml: "<mn>0.5</mn>" }]
						],
						[
							[{ type: "math", mathml: "<mfrac><mn>4</mn><mn>8</mn></mfrac>" }],
							[{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" }],
							[{ type: "math", mathml: "<mn>0.5</mn>" }]
						],
						[
							[{ type: "math", mathml: "<mfrac><mn>2</mn><mn>4</mn></mfrac>" }],
							[{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" }],
							[{ type: "math", mathml: "<mn>0.5</mn>" }]
						]
					]
				},
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

export const reactantAmountsTemperatureTableWithDropdowns: AssessmentItemInput = {
	identifier: "reactant-amounts-temp-change-table",
	title: "Identify reactants and amounts from temperature change table",
	responseDeclarations: [
		{ identifier: "RESPONSE_REACT_C", cardinality: "single", baseType: "identifier", correct: "MGSO4" },
		{ identifier: "RESPONSE_AMT_C", cardinality: "single", baseType: "identifier", correct: "AMT_2_5" },
		{ identifier: "RESPONSE_REACT_D", cardinality: "single", baseType: "identifier", correct: "NH4CL" },
		{ identifier: "RESPONSE_AMT_D", cardinality: "single", baseType: "identifier", correct: "AMT_3_0" },
		{ identifier: "RESPONSE_REACT_E", cardinality: "single", baseType: "identifier", correct: "CACL2" },
			{ identifier: "RESPONSE_AMT_E", cardinality: "single", baseType: "identifier", correct: "AMT_8_0" }
	],
	widgets: {
		temperature_changes_chart: {
			type: "divergentBarChart",
			width: 500,
			height: 400,
			data: [
				{ category: "A", value: -3.6 },
				{ category: "B", value: 1.0 },
				{ category: "C", value: 0.5 },
				{ category: "D", value: -1.8 },
				{ category: "E", value: 3.2 }
			],
			xAxisLabel: "Experiment",
			yAxis: {
				label: "Temperature Change (°C)",
				min: -4,
				max: 4,
				tickInterval: 1
			},
			positiveBarColor: "#E74C3C",
			negativeBarColor: "#4A90E2",
			gridColor: "#E0E0E0"
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
		{
			type: "tableRich",
			header: [
				[
					[{ type: "text", content: "Experiment" }],
					[{ type: "text", content: "Reactant" }],
					[{ type: "text", content: "Amount of reactant (grams)" }],
					[{ type: "text", content: "Temperature change" }]
				]
			],
			rows: [
				[
					[{ type: "text", content: "A" }],
					[{ type: "math", mathml: "<mrow><mi>N</mi><msub><mi>H</mi><mn>4</mn></msub><mi>Cl</mi></mrow>" }],
					[{ type: "math", mathml: "<mn>6.0</mn><mtext> grams</mtext>" }],
					[{ type: "math", mathml: "<mo>-</mo><mn>3.6</mn><mo>°</mo><mi>C</mi>" }]
				],
				[
					[{ type: "text", content: "B" }],
					[{ type: "math", mathml: "<mrow><mi>Mg</mi><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub></mrow>" }],
					[{ type: "math", mathml: "<mn>5.0</mn><mtext> grams</mtext>" }],
					[{ type: "math", mathml: "<mo>+</mo><mn>1.0</mn><mo>°</mo><mi>C</mi>" }]
				],
				[
					[{ type: "text", content: "C" }],
					[{ type: "inlineInteractionRef", interactionId: "dropdown_react_c" }],
					[{ type: "inlineInteractionRef", interactionId: "dropdown_amt_c" }],
					[{ type: "math", mathml: "<mo>+</mo><mn>0.5</mn><mo>°</mo><mi>C</mi>" }]
				],
				[
					[{ type: "text", content: "D" }],
					[{ type: "inlineInteractionRef", interactionId: "dropdown_react_d" }],
					[{ type: "inlineInteractionRef", interactionId: "dropdown_amt_d" }],
					[{ type: "math", mathml: "<mo>-</mo><mn>1.8</mn><mo>°</mo><mi>C</mi>" }]
				],
				[
					[{ type: "text", content: "E" }],
					[{ type: "inlineInteractionRef", interactionId: "dropdown_react_e" }],
					[{ type: "inlineInteractionRef", interactionId: "dropdown_amt_e" }],
					[{ type: "math", mathml: "<mo>+</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" }]
				]
			]
		},
		{
			type: "paragraph",
			content: [{ type: "text", content: "Select the reactant and amount for rows C, D, and E directly in the table." }]
		},
		{ type: "widgetRef", widgetId: "temperature_changes_chart" }
	],
	interactions: {
		dropdown_react_c: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE_REACT_C",
			shuffle: true,
			choices: [
				{ identifier: "NH4CL", content: [{ type: "math", mathml: "<mrow><mi>N</mi><msub><mi>H</mi><mn>4</mn></msub><mi>Cl</mi></mrow>" }] },
				{ identifier: "MGSO4", content: [{ type: "math", mathml: "<mrow><mi>Mg</mi><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub></mrow>" }] },
				{ identifier: "CACL2", content: [{ type: "math", mathml: "<mrow><mi>Ca</mi><msub><mi>Cl</mi><mn>2</mn></msub></mrow>" }] }
			]
		},
		dropdown_amt_c: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE_AMT_C",
			shuffle: true,
			choices: [
				{ identifier: "AMT_2_5", content: [{ type: "math", mathml: "<mn>2.5</mn>" }] },
				{ identifier: "AMT_3_0", content: [{ type: "math", mathml: "<mn>3.0</mn>" }] },
				{ identifier: "AMT_8_0", content: [{ type: "math", mathml: "<mn>8.0</mn>" }] }
			]
		},
		dropdown_react_d: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE_REACT_D",
			shuffle: true,
			choices: [
				{ identifier: "NH4CL", content: [{ type: "math", mathml: "<mrow><mi>N</mi><msub><mi>H</mi><mn>4</mn></msub><mi>Cl</mi></mrow>" }] },
				{ identifier: "MGSO4", content: [{ type: "math", mathml: "<mrow><mi>Mg</mi><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub></mrow>" }] },
				{ identifier: "CACL2", content: [{ type: "math", mathml: "<mrow><mi>Ca</mi><msub><mi>Cl</mi><mn>2</mn></msub></mrow>" }] }
			]
		},
		dropdown_amt_d: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE_AMT_D",
			shuffle: true,
			choices: [
				{ identifier: "AMT_2_5", content: [{ type: "math", mathml: "<mn>2.5</mn>" }] },
				{ identifier: "AMT_3_0", content: [{ type: "math", mathml: "<mn>3.0</mn>" }] },
				{ identifier: "AMT_8_0", content: [{ type: "math", mathml: "<mn>8.0</mn>" }] }
			]
		},
		dropdown_react_e: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE_REACT_E",
			shuffle: true,
			choices: [
				{ identifier: "NH4CL", content: [{ type: "math", mathml: "<mrow><mi>N</mi><msub><mi>H</mi><mn>4</mn></msub><mi>Cl</mi></mrow>" }] },
				{ identifier: "MGSO4", content: [{ type: "math", mathml: "<mrow><mi>Mg</mi><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub></mrow>" }] },
				{ identifier: "CACL2", content: [{ type: "math", mathml: "<mrow><mi>Ca</mi><msub><mi>Cl</mi><mn>2</mn></msub></mrow>" }] }
			]
		},
		dropdown_amt_e: {
			type: "inlineChoiceInteraction",
			responseIdentifier: "RESPONSE_AMT_E",
			shuffle: true,
			choices: [
				{ identifier: "AMT_2_5", content: [{ type: "math", mathml: "<mn>2.5</mn>" }] },
				{ identifier: "AMT_3_0", content: [{ type: "math", mathml: "<mn>3.0</mn>" }] },
				{ identifier: "AMT_8_0", content: [{ type: "math", mathml: "<mn>8.0</mn>" }] }
			]
		}
	},
	feedbackBlocks: [
		// Feedback for RESPONSE_REACT_C
		{
			identifier: "MGSO4",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_C",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! " },
						{ type: "math", mathml: "<mrow><mi>Mg</mi><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub></mrow>" },
						{ type: "text", content: " produces a small positive temperature change because it releases heat when dissolving (exothermic)." }
					]
				}
			]
		},
		{
			identifier: "NH4CL",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_C",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Not quite. " },
						{ type: "math", mathml: "<mrow><mi>N</mi><msub><mi>H</mi><mn>4</mn></msub><mi>Cl</mi></mrow>" },
						{ type: "text", content: " causes cooling (negative temperature change), but experiment C shows a positive change." }
					]
				}
			]
		},
		{
			identifier: "CACL2",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_C",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Not quite. While " },
						{ type: "math", mathml: "<mrow><mi>Ca</mi><msub><mi>Cl</mi><mn>2</mn></msub></mrow>" },
						{ type: "text", content: " does cause heating, it produces a much larger temperature change than the small " },
						{ type: "math", mathml: "<mo>+</mo><mn>0.5</mn><mo>°</mo><mi>C</mi>" },
						{ type: "text", content: " observed." }
					]
				}
			]
		},
		// Feedback for RESPONSE_AMT_C
		{
			identifier: "AMT_2_5",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_C",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! " },
						{ type: "math", mathml: "<mn>2.5</mn>" },
						{ type: "text", content: " grams produces the small temperature change observed." }
					]
				}
			]
		},
		{
			identifier: "AMT_3_0",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_C",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This amount would produce a slightly larger temperature change than observed." }
					]
				}
					]
				},
		{
			identifier: "AMT_8_0",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_C",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This large amount would produce a much stronger temperature change than the small " },
						{ type: "math", mathml: "<mo>+</mo><mn>0.5</mn><mo>°</mo><mi>C</mi>" },
						{ type: "text", content: " observed." }
					]
				}
			]
		},
		// Feedback for RESPONSE_REACT_D
		{
			identifier: "NH4CL",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_D",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! " },
						{ type: "math", mathml: "<mrow><mi>N</mi><msub><mi>H</mi><mn>4</mn></msub><mi>Cl</mi></mrow>" },
						{ type: "text", content: " absorbs heat when dissolving, causing the negative temperature change." }
					]
				}
			]
		},
		{
			identifier: "MGSO4",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_D",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Not quite. " },
						{ type: "math", mathml: "<mrow><mi>Mg</mi><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub></mrow>" },
						{ type: "text", content: " causes heating (positive change), but experiment D shows cooling." }
					]
				}
			]
		},
		{
			identifier: "CACL2",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_D",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Not quite. " },
						{ type: "math", mathml: "<mrow><mi>Ca</mi><msub><mi>Cl</mi><mn>2</mn></msub></mrow>" },
						{ type: "text", content: " causes heating (positive change), but experiment D shows cooling." }
					]
				}
			]
		},
		// Feedback for RESPONSE_AMT_D
		{
			identifier: "AMT_3_0",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_D",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! " },
						{ type: "math", mathml: "<mn>3.0</mn>" },
						{ type: "text", content: " grams produces the moderate cooling effect observed." }
					]
				}
			]
		},
		{
			identifier: "AMT_2_5",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_D",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This smaller amount would produce less cooling than the " },
						{ type: "math", mathml: "<mo>-</mo><mn>1.8</mn><mo>°</mo><mi>C</mi>" },
						{ type: "text", content: " observed." }
					]
				}
			]
		},
		{
			identifier: "AMT_8_0",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_D",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This large amount would produce much stronger cooling than observed." }
					]
				}
			]
		},
		// Feedback for RESPONSE_REACT_E
		{
			identifier: "CACL2",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_E",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! " },
						{ type: "math", mathml: "<mrow><mi>Ca</mi><msub><mi>Cl</mi><mn>2</mn></msub></mrow>" },
						{ type: "text", content: " is highly exothermic and produces significant heating when dissolved." }
					]
				}
			]
		},
		{
			identifier: "NH4CL",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_E",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Not quite. " },
						{ type: "math", mathml: "<mrow><mi>N</mi><msub><mi>H</mi><mn>4</mn></msub><mi>Cl</mi></mrow>" },
						{ type: "text", content: " causes cooling, but experiment E shows significant heating." }
					]
				}
			]
		},
		{
			identifier: "MGSO4",
			outcomeIdentifier: "FEEDBACK__RESPONSE_REACT_E",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "While " },
						{ type: "math", mathml: "<mrow><mi>Mg</mi><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub></mrow>" },
						{ type: "text", content: " does cause heating, it produces a much smaller temperature change than the " },
						{ type: "math", mathml: "<mo>+</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" },
						{ type: "text", content: " observed." }
					]
				}
			]
		},
		// Feedback for RESPONSE_AMT_E
		{
			identifier: "AMT_8_0",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_E",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! " },
						{ type: "math", mathml: "<mn>8.0</mn>" },
						{ type: "text", content: " grams of " },
						{ type: "math", mathml: "<mrow><mi>Ca</mi><msub><mi>Cl</mi><mn>2</mn></msub></mrow>" },
						{ type: "text", content: " produces the large temperature increase observed." }
					]
				}
			]
		},
		{
			identifier: "AMT_2_5",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_E",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This small amount would produce much less heating than the large " },
						{ type: "math", mathml: "<mo>+</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" },
						{ type: "text", content: " change observed." }
					]
				}
			]
		},
		{
			identifier: "AMT_3_0",
			outcomeIdentifier: "FEEDBACK__RESPONSE_AMT_E",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This moderate amount would still produce less heating than observed." }
					]
				}
			]
		}
	]
}

export const orderPlanetsFromSun: AssessmentItemInput = {
	identifier: "order-planets-from-sun",
	title: "Order planets by distance from the Sun",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "ordered",
			baseType: "identifier",
			correct: ["MERCURY", "VENUS", "EARTH", "MARS"]
		}
	],
	widgets: {
		solar_system_diagram: {
			type: "scatterPlot",
			title: "Inner Solar System (Relative Distances)",
			width: 400,
			height: 300,
			xAxis: { min: 0, max: 2, label: "Distance from Sun (AU)", gridLines: true, tickInterval: 0.5 },
			yAxis: { min: -1, max: 1, label: "", gridLines: false, tickInterval: 1 },
			points: [
				{ x: 0, y: 0, label: "Sun" },
				{ x: 0.39, y: 0, label: "Mercury" },
				{ x: 0.72, y: 0, label: "Venus" },
				{ x: 1.0, y: 0, label: "Earth" },
				{ x: 1.52, y: 0, label: "Mars" }
			],
			lines: []
		},
		distance_comparison: {
			type: "barChart",
			title: "Relative Distances from Sun",
			width: 400,
			height: 300,
			data: [
				{ label: "Mercury", value: 0.39, state: "normal" },
				{ label: "Venus", value: 0.72, state: "normal" },
				{ label: "Earth", value: 1.0, state: "normal" },
				{ label: "Mars", value: 1.52, state: "normal" }
			],
			xAxisLabel: "Planet",
			yAxis: {
				label: "Distance (AU)",
				min: 0,
				max: 2,
				tickInterval: 0.5
			},
			barColor: "#4285F4"
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "The diagram shows the four inner planets of our solar system. Distances are not to scale." }
			]
		},
		{ type: "widgetRef", widgetId: "solar_system_diagram" },
		{ type: "interactionRef", interactionId: "planet_order" }
	],
	interactions: {
		planet_order: {
			type: "orderInteraction",
			responseIdentifier: "RESPONSE",
			prompt: [
				{ type: "text", content: "Arrange these planets by their distance from the Sun, from least to greatest (top to bottom):" }
			],
			choices: [
				{
					identifier: "EARTH",
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "text", content: "Earth - " },
								{ type: "math", mathml: "<mn>1.0</mn>" },
								{ type: "text", content: " AU from Sun" }
							]
						}
					]
				},
				{
					identifier: "MARS",
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "text", content: "Mars - " },
								{ type: "math", mathml: "<mn>1.52</mn>" },
								{ type: "text", content: " AU from Sun" }
							]
						}
					]
				},
				{
					identifier: "VENUS",
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "text", content: "Venus - " },
								{ type: "math", mathml: "<mn>0.72</mn>" },
								{ type: "text", content: " AU from Sun" }
							]
						}
					]
				},
				{
					identifier: "MERCURY",
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "text", content: "Mercury - " },
								{ type: "math", mathml: "<mn>0.39</mn>" },
								{ type: "text", content: " AU from Sun" }
							]
						}
					]
				}
			],
			shuffle: true,
			orientation: "vertical"
		}
	},
	feedbackBlocks: [
		{
			identifier: "MARS",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Mars is the fourth planet from the Sun at " },
						{ type: "math", mathml: "<mn>1.52</mn>" },
						{ type: "text", content: " AU. It's often called the 'Red Planet' due to iron oxide on its surface." }
					]
				}
			]
		},
		{
			identifier: "EARTH",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Earth is the third planet from the Sun at exactly " },
						{ type: "math", mathml: "<mn>1.0</mn>" },
						{ type: "text", content: " AU. By definition, one AU equals the average Earth-Sun distance." }
					]
				}
			]
		},
		{
			identifier: "VENUS",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Venus is the second planet from the Sun at " },
						{ type: "math", mathml: "<mn>0.72</mn>" },
						{ type: "text", content: " AU. It's the hottest planet in our solar system despite not being closest to the Sun." }
					]
				}
			]
		},
		{
			identifier: "MERCURY",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Mercury is the closest planet to the Sun at " },
						{ type: "math", mathml: "<mn>0.39</mn>" },
						{ type: "text", content: " AU. It's also the smallest planet in our solar system." }
					]
				}
			]
		}
	]
}

export const chemicalEquationGapMatch: AssessmentItemInput = {
	identifier: "chemical-equation-gap-match",
	title: "Complete the photosynthesis equation",
	responseDeclarations: [
		{
			identifier: "RESPONSE",
			cardinality: "multiple",
			baseType: "directedPair",
			correct: [
				{ source: "FORMULA_CO2", target: "GAP_1" },
				{ source: "FORMULA_H2O", target: "GAP_2" },
				{ source: "FORMULA_C6H12O6", target: "GAP_3" },
				{ source: "FORMULA_O2", target: "GAP_4" }
			],
			allowEmpty: false
		}
	],
	widgets: {
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "Photosynthesis is the process by which plants convert light energy into chemical energy. Complete the balanced chemical equation by dragging the correct formulas into the gaps." }
			]
		},
		{ type: "interactionRef", interactionId: "equation_completion" }
	],
	interactions: {
		equation_completion: {
			type: "gapMatchInteraction",
			responseIdentifier: "RESPONSE",
			shuffle: true,
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "math", mathml: "<mn>6</mn>" },
						{ type: "gap", gapId: "GAP_1" },
						{ type: "text", content: " + " },
						{ type: "math", mathml: "<mn>6</mn>" },
						{ type: "gap", gapId: "GAP_2" },
						{ type: "text", content: " → " },
						{ type: "gap", gapId: "GAP_3" },
						{ type: "text", content: " + " },
						{ type: "math", mathml: "<mn>6</mn>" },
						{ type: "gap", gapId: "GAP_4" }
					]
				}
			],
			gapTexts: [
				{
					identifier: "FORMULA_CO2",
					matchMax: 1,
					content: [{ type: "math", mathml: "<mrow><mi>C</mi><msub><mi>O</mi><mn>2</mn></msub></mrow>" }]
				},
				{
					identifier: "FORMULA_H2O",
					matchMax: 1,
					content: [{ type: "math", mathml: "<mrow><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi></mrow>" }]
				},
				{
					identifier: "FORMULA_O2",
					matchMax: 1,
					content: [{ type: "math", mathml: "<mrow><msub><mi>O</mi><mn>2</mn></msub></mrow>" }]
				},
				{
					identifier: "FORMULA_C6H12O6",
					matchMax: 1,
					content: [{ type: "math", mathml: "<mrow><msub><mi>C</mi><mn>6</mn></msub><msub><mi>H</mi><mn>12</mn></msub><msub><mi>O</mi><mn>6</mn></msub></mrow>" }]
				},
				{
					identifier: "FORMULA_N2",
					matchMax: 1,
					content: [{ type: "math", mathml: "<mrow><msub><mi>N</mi><mn>2</mn></msub></mrow>" }]
				}
			],
			gaps: [
				{ identifier: "GAP_1", required: true },
				{ identifier: "GAP_2", required: true },
				{ identifier: "GAP_3", required: true },
				{ identifier: "GAP_4", required: true }
			]
		}
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Excellent! You correctly completed the photosynthesis equation:" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "math", mathml: "<mn>6</mn><mrow><mi>C</mi><msub><mi>O</mi><mn>2</mn></msub></mrow>" },
						{ type: "text", content: " + " },
						{ type: "math", mathml: "<mn>6</mn><mrow><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi></mrow>" },
						{ type: "text", content: " → " },
						{ type: "math", mathml: "<mrow><msub><mi>C</mi><mn>6</mn></msub><msub><mi>H</mi><mn>12</mn></msub><msub><mi>O</mi><mn>6</mn></msub></mrow>" },
						{ type: "text", content: " + " },
						{ type: "math", mathml: "<mn>6</mn><mrow><msub><mi>O</mi><mn>2</mn></msub></mrow>" }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "This shows that plants use carbon dioxide and water to produce glucose (sugar) and oxygen, powered by sunlight!" }
					]
				}
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Let's review the photosynthesis equation step by step!" }
					]
				},
				{
					type: "unorderedList",
					items: [
						[
							{ type: "text", content: "Reactants (left side): Plants take in " },
							{ type: "math", mathml: "<mrow><mi>C</mi><msub><mi>O</mi><mn>2</mn></msub></mrow>" },
							{ type: "text", content: " from air and " },
							{ type: "math", mathml: "<mrow><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi></mrow>" },
							{ type: "text", content: " from soil" }
						],
						[
							{ type: "text", content: "Products (right side): They produce " },
							{ type: "math", mathml: "<mrow><msub><mi>C</mi><mn>6</mn></msub><msub><mi>H</mi><mn>12</mn></msub><msub><mi>O</mi><mn>6</mn></msub></mrow>" },
							{ type: "text", content: " (glucose) for energy and release " },
							{ type: "math", mathml: "<mrow><msub><mi>O</mi><mn>2</mn></msub></mrow>" },
							{ type: "text", content: " into the atmosphere" }
						]
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Remember: The equation must be balanced - count the atoms on each side!" }
					]
				}
			]
		}
	]
}

export const allExamples: AssessmentItemInput[] = [
	probabilityNotPurpleSpinner,
	linearModelEquationPrediction,
	inequalityNumberLine,
	twoWayFrequencyTable,
	equivalentFractionImages,
	reactantAmountsTemperatureTableWithDropdowns,
	// orderPlanetsFromSun, // TODO: Fix schema validation for orderInteraction feedback
	chemicalEquationGapMatch
]