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
				{ type: "inlineSlot", slotId: "text_entry" }
			]
		},
		{
			type: "blockSlot",
			slotId: "image_1"
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
						{ type: "text", content: "Correct! The probability of not landing on purple is " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mn>0.75</mn>" },
						{ type: "text", content: " (or " },
						{ type: "math", mathml: "<mn>75</mn><mo>%</mo>" },
						{ type: "text", content: ")." }
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
						{ type: "text", content: "Not quite. There are 3 favorable outcomes out of 4 equally likely outcomes." }
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
		{ type: "blockSlot", slotId: "image_1" },
		{
			type: "paragraph",
			content: [{ type: "text", content: "Which of these linear equations best describes the given model?" }]
		},
		{ type: "blockSlot", slotId: "choice_interaction" },
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
				{ type: "inlineSlot", slotId: "text_entry" },
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
						{ type: "text", content: "Correct! A reasonable linear model fits the points with a slope of " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " and a vertical intercept of " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ", so the equation is " },
						{
							type: "math",
							mathml:
								'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1.5</mn></mrow>'
						},
						{ type: "text", content: "." }
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
					content: [{ type: "text", content: "Incorrect. The slope is 2, not 1." }]
				}
			]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE_CHOICE",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "Incorrect. The y-intercept should be positive 1.5, not negative." }]
				}
			]
		},
		{
			identifier: "D",
			outcomeIdentifier: "FEEDBACK__RESPONSE_CHOICE",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "Incorrect. Both the slope and y-intercept are wrong." }]
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
						{ type: "text", content: "Using this model for " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>6</mn>" },
						{ type: "text", content: " hours gives " },
						{
							type: "math",
							mathml:
								'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mo>(</mo><mn>6</mn><mo>)</mo><mo>+</mo><mn>1.5</mn><mo>=</mo><mn>12</mn><mo>+</mo><mn>1.5</mn><mo>=</mo><mn>13.5</mn></mrow>'
						},
						{ type: "text", content: " km." }
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
								"Not quite. Estimate the slope from two clear points on the fitted line, then read the vertical intercept."
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "For example, using points " },
						{ type: "math", mathml: "<mo>(</mo><mn>0</mn><mo>,</mo><mn>1.5</mn><mo>)</mo>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mo>(</mo><mn>1</mn><mo>,</mo><mn>3.5</mn><mo>)</mo>" },
						{ type: "text", content: " on the line, the slope is " },
						{
							type: "math",
							mathml:
								"<mrow><mfrac><mrow><mn>3.5</mn><mo>-</mo><mn>1.5</mn></mrow><mrow><mn>1</mn><mo>-</mo><mn>0</mn></mrow></mfrac><mo>=</mo><mn>2</mn></mrow>"
						},
						{ type: "text", content: " and the intercept is " },
						{ type: "math", mathml: "<mn>1.5</mn>" },
						{ type: "text", content: ", giving the model " },
						{
							type: "math",
							mathml:
								'<mrow><mover accent="true"><mi>y</mi><mo>^</mo></mover><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1.5</mn></mrow>'
						},
						{ type: "text", content: ". Then evaluate it at " },
						{ type: "math", mathml: "<mi>x</mi><mo>=</mo><mn>6</mn>" },
						{ type: "text", content: " to find the predicted distance." }
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
		{ type: "blockSlot", slotId: "stimulus_dnl" },
		{ type: "blockSlot", slotId: "choice_interaction" }
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
					content: [{ type: "blockSlot", slotId: "choice_a_dnl" }]
				},
				{
					identifier: "B",
					content: [{ type: "blockSlot", slotId: "choice_b_dnl" }]
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
						{ type: "text", content: "Correct! The ratio of distance to elevation is " },
						{ type: "math", mathml: "<mn>3</mn><mo>:</mo><mn>120</mn>" },
						{ type: "text", content: ", which simplifies to a unit rate of " },
						{ type: "math", mathml: "<mn>1</mn><mo>:</mo><mn>40</mn>" },
						{ type: "text", content: ". For every " },
						{ type: "math", mathml: "<mn>1</mn><mtext> km</mtext>" },
						{ type: "text", content: " hiked, the elevation increases by " },
						{ type: "math", mathml: "<mn>40</mn><mtext> m</mtext>" },
						{ type: "text", content: ". This matches the correct number line." }
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
						{ type: "text", content: "Not quite. First, find the unit rate. If Cory's elevation is " },
						{ type: "math", mathml: "<mn>120</mn><mtext> m</mtext>" },
						{ type: "text", content: " after " },
						{ type: "math", mathml: "<mn>3</mn><mtext> km</mtext>" },
						{ type: "text", content: ", the rate is " },
						{
							type: "math",
							mathml:
								"<mfrac><mrow><mn>120</mn><mtext> m</mtext></mrow><mrow><mn>3</mn><mtext> km</mtext></mrow></mfrac><mo>=</mo><mn>40</mn>"
						},
						{
							type: "text",
							content: " meters per kilometer. Use this rate to fill in the other values on the number line."
						}
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
				{ type: "text", content: "Evaluate." },
				{
					type: "math",
					mathml:
						"<mrow><mfrac><msup><mn>2</mn><mrow><mo>-</mo><mfrac><mn>4</mn><mn>3</mn></mfrac></mrow></msup><msup><mn>54</mn><mrow><mo>-</mo><mfrac><mn>4</mn><mn>3</mn></mfrac></mrow></msup></mfrac><mo>=</mo></mrow>"
				},
				{ type: "text", content: " " },
				{ type: "inlineSlot", slotId: "text_entry" }
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
	widgets: null,
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! The answer is " },
						{ type: "math", mathml: "<mn>81</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "You successfully applied the rule: " },
						{
							type: "math",
							mathml:
								"<mfrac><msup><mi>a</mi><mi>n</mi></msup><msup><mi>b</mi><mi>n</mi></msup></mfrac><mo>=</mo><msup><mrow><mo>(</mo><mfrac><mi>a</mi><mi>b</mi></mfrac><mo>)</mo></mrow><mi>n</mi></msup>"
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
					content: [{ type: "text", content: "Not quite. Let me help you solve this step by step." }]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "First, use the rule: " },
						{
							type: "math",
							mathml:
								"<mfrac><msup><mi>a</mi><mi>n</mi></msup><msup><mi>b</mi><mi>n</mi></msup></mfrac><mo>=</mo><msup><mrow><mo>(</mo><mfrac><mi>a</mi><mi>b</mi></mfrac><mo>)</mo></mrow><mi>n</mi></msup>"
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "So: " },
						{
							type: "math",
							mathml:
								"<mfrac><msup><mn>2</mn><mrow><mo>-</mo><mfrac><mn>4</mn><mn>3</mn></mfrac></mrow></msup><msup><mn>54</mn><mrow><mo>-</mo><mfrac><mn>4</mn><mn>3</mn></mfrac></mrow></msup></mfrac><mo>=</mo><msup><mrow><mo>(</mo><mfrac><mn>2</mn><mn>54</mn></mfrac><mo>)</mo></mrow><mrow><mo>-</mo><mfrac><mn>4</mn><mn>3</mn></mfrac></mrow></msup><mo>=</mo><msup><mrow><mo>(</mo><mfrac><mn>1</mn><mn>27</mn></mfrac><mo>)</mo></mrow><mrow><mo>-</mo><mfrac><mn>4</mn><mn>3</mn></mfrac></mrow></msup><mo>=</mo><msup><mn>27</mn><mfrac><mn>4</mn><mn>3</mn></mfrac></msup>"
						}
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Then: " },
						{
							type: "math",
							mathml:
								"<msup><mn>27</mn><mfrac><mn>4</mn><mn>3</mn></mfrac></msup><mo>=</mo><msup><mrow><mo>(</mo><mroot><mn>27</mn><mn>3</mn></mroot><mo>)</mo></mrow><mn>4</mn></msup><mo>=</mo><msup><mn>3</mn><mn>4</mn></msup><mo>=</mo><mn>81</mn>"
						}
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
	body: [{ type: "blockSlot", slotId: "order_interaction" }],
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
	widgets: null,
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! You have arranged the cards as " },
						{ type: "math", mathml: "<mn>708</mn><mo>&gt;</mo><mn>79</mn>" },
						{ type: "text", content: ", which is a true comparison." }
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
								"Not quite. Make sure the largest number is on the left and the symbol correctly represents the relationship."
						}
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
		}
	},
	body: [
		{ type: "blockSlot", slotId: "inequality_widget" },
		{ type: "blockSlot", slotId: "choice_interaction" }
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
						{
							type: "text",
							content: "Incorrect. This represents values less than 0, but the graph shows values greater than 0."
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
							content: "Incorrect. This includes 0 (closed point), but the graph shows an open point at 0."
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
							content: "Correct! The graph shows an open point at "
						},
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: " with an arrow to the right, representing all values strictly greater than " },
						{ type: "math", mathml: "<mn>0</mn>" },
						{ type: "text", content: ", so the inequality is " },
						{ type: "math", mathml: "<mi>x</mi><mo>&gt;</mo><mn>0</mn>" },
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
							content: "Incorrect. This includes 0 (closed point), but the graph shows an open point at 0."
						}
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
		{ type: "blockSlot", slotId: "vertical_nl" },
		{
			type: "paragraph",
			content: [
				{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
				{ type: "text", content: " is " },
				{ type: "inlineSlot", slotId: "pos_choice" },
				{ type: "text", content: " " },
				{ type: "math", mathml: "<mo>-</mo><mn>6.4</mn>" },
				{ type: "text", content: ", so " },
				{ type: "math", mathml: "<mo>-</mo><mn>1.4</mn>" },
				{ type: "text", content: " is " },
				{ type: "inlineSlot", slotId: "comp_choice" },
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
			content: [{ type: "paragraph", content: [{ type: "text", content: "Correct: -1.4 is above -6.4." }] }]
		},
		{
			identifier: "BELOW",
			outcomeIdentifier: "FEEDBACK__RESPONSE_POS",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "Not quite: -1.4 is above -6.4 on a vertical number line." }]
				}
			]
		},
		{
			identifier: "GT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_COMP",
			content: [
				{ type: "paragraph", content: [{ type: "text", content: "Correct: a higher position means greater value." }] }
			]
		},
		{
			identifier: "LT",
			outcomeIdentifier: "FEEDBACK__RESPONSE_COMP",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "Not quite: since -1.4 is higher than -6.4, -1.4 is greater." }]
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
		{ type: "blockSlot", slotId: "venn_widget" },
		{
			type: "paragraph",
			content: [{ type: "text", content: "Complete the following two-way frequency table." }]
		},
		{ type: "blockSlot", slotId: "table_widget" }
	],
	interactions: {},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "Correct! The completed table is:" }]
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
						{ type: "text", content: "Not quite. Use the numbers in the Venn diagram. The overlap (" },
						{ type: "math", mathml: "<mn>23</mn>" },
						{ type: "text", content: ') belongs in the "Received medicine" & "Cold ' },
						{ type: "math", mathml: "<mo>≥</mo><mn>7</mn>" },
						{ type: "text", content: ' days" cell. Then distribute the other counts accordingly.' }
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
		{ type: "blockSlot", slotId: "stimulus_shape" },
		{ type: "blockSlot", slotId: "choice_interaction" }
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
					content: [{ type: "blockSlot", slotId: "choice_a_shape" }]
				},
				{
					identifier: "B",
					content: [{ type: "blockSlot", slotId: "choice_b_shape" }]
				},
				{
					identifier: "C",
					content: [{ type: "blockSlot", slotId: "choice_c_shape" }]
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
						{ type: "text", content: "Correct! This rectangle has " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " out of " },
						{ type: "math", mathml: "<mn>8</mn>" },
						{ type: "text", content: " parts shaded, which equals " },
						{ type: "math", mathml: "<mfrac><mn>4</mn><mn>8</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
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
						{ type: "text", content: "Correct! This rectangle has " },
						{ type: "math", mathml: "<mn>2</mn>" },
						{ type: "text", content: " out of " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " parts shaded, which equals " },
						{ type: "math", mathml: "<mfrac><mn>2</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" },
						{ type: "text", content: " = " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
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
						{ type: "text", content: "Not quite. This rectangle has " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " out of " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " parts shaded, which equals " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: ". Since " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " is not equal to " },
						{ type: "math", mathml: "<mfrac><mn>3</mn><mn>6</mn></mfrac>" },
						{ type: "text", content: " (which equals " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>2</mn></mfrac>" },
						{ type: "text", content: "), this is incorrect." }
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
		}
	},
	body: [
		{ type: "blockSlot", slotId: "multi_shape" },
		{ type: "blockSlot", slotId: "choice_interaction" }
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
						{ type: "text", content: "Not quite. This would mean " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " groups of " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>3</mn></mfrac>" },
						{ type: "text", content: " each. But we have " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " circles, each with " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " shaded, not " },
						{ type: "math", mathml: "<mn>4</mn>" },
						{ type: "text", content: " groups of " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>3</mn></mfrac>" },
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
						{ type: "text", content: "Correct! There are " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " circles and " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " of each circle is shaded. We can multiply: " },
						{ type: "math", mathml: "<mn>3</mn><mo>×</mo><mfrac><mn>1</mn><mn>4</mn></mfrac>" },
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
						{ type: "text", content: "Correct! Since we have " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " circles and each has " },
						{ type: "math", mathml: "<mfrac><mn>1</mn><mn>4</mn></mfrac>" },
						{ type: "text", content: " shaded, we can add: " },
						{
							type: "math",
							mathml:
								"<mfrac><mn>1</mn><mn>4</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac>"
						},
						{ type: "text", content: "." }
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
				{ type: "inlineSlot", slotId: "x_entry" },
				{ type: "text", content: ", " },
				{ type: "inlineSlot", slotId: "y_entry" },
				{ type: "text", content: ") and radius " },
				{ type: "inlineSlot", slotId: "r_entry" },
				{ type: "text", content: "?" }
			]
		}
	],
	interactions: {
		x_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_X", expectedLength: 3 },
		y_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_Y", expectedLength: 3 },
		r_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_R", expectedLength: 2 }
	},
	widgets: null,
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Correct! You successfully found that the circle is centered at (" },
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
						{ type: "text", content: "You correctly converted the equation to standard form: " },
						{
							type: "math",
							mathml:
								"<msup><mrow><mo>(</mo><mi>x</mi><mo>+</mo><mn>9</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>+</mo><msup><mrow><mo>(</mo><mi>y</mi><mo>+</mo><mn>7</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><mn>25</mn>"
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
					content: [{ type: "text", content: "Not quite. Let's complete the square to find the center and radius." }]
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
						{ type: "text", content: "Therefore: center = (" },
						{ type: "math", mathml: "<mo>-</mo><mn>9</mn>" },
						{ type: "text", content: ", " },
						{ type: "math", mathml: "<mo>-</mo><mn>7</mn>" },
						{ type: "text", content: ") and radius = " },
						{ type: "math", mathml: "<mn>5</mn>" }
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
		}
	},
	body: [
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "The following table shows each of Haruka's final exam scores last semester." }
			]
		},
		{ type: "blockSlot", slotId: "score_table" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "If the mean of the data set is " },
				{ type: "math", mathml: "<mn>84</mn>" },
				{ type: "text", content: " points, find Haruka's final exam score in chemistry. " },
				{ type: "inlineSlot", slotId: "text_entry" }
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
						{ type: "text", content: "Correct! Haruka scored " },
						{ type: "math", mathml: "<mn>87</mn>" },
						{ type: "text", content: " points on her chemistry exam." }
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
					content: [{ type: "text", content: "Not quite. To find the missing score, use the formula for mean:" }]
				},
				{
					type: "paragraph",
					content: [{ type: "text", content: "Mean = (Sum of all scores) ÷ (Number of scores)" }]
				},
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
		{ type: "blockSlot", slotId: "gdp_table" },
		{ type: "blockSlot", slotId: "choice_interaction" }
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
		{ type: "blockSlot", slotId: "choice_interaction" }
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
				{ type: "inlineSlot", slotId: "text_entry" }
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
		{ type: "blockSlot", slotId: "h_table" },
		{ type: "blockSlot", slotId: "choice_interaction" }
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
	body: [{ type: "blockSlot", slotId: "choice_interaction" }],
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
					content: [{ type: "blockSlot", slotId: "choice_3_apples" }]
				},
				{
					identifier: "CHOICE_4",
					content: [{ type: "blockSlot", slotId: "choice_4_apples" }]
				},
				{
					identifier: "CHOICE_5",
					content: [{ type: "blockSlot", slotId: "choice_5_apples" }]
				},
				{
					identifier: "CHOICE_6",
					content: [{ type: "blockSlot", slotId: "choice_6_apples" }]
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
						{ type: "text", content: "Not quite. Count the apples in each box to find the one with exactly five." }
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
						{ type: "text", content: "Not quite. Count the apples in each box to find the one with exactly five." }
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
					content: [{ type: "text", content: "Great job! That box has exactly five apples." }]
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
						{ type: "text", content: "Not quite. Count the apples in each box to find the one with exactly five." }
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
		{ type: "blockSlot", slotId: "react_temp_table" },
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
						{ type: "text", content: "Great job! You matched reactants and amounts to the temperature changes." }
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
								"Not quite. Identify whether the temperature increases (exothermic) or decreases (endothermic), then compare magnitudes to match amounts."
						}
					]
				}
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
		}
	},
	body: [
		{ type: "paragraph", content: [{ type: "text", content: "Complete the table for each pair of objects." }] },
		{ type: "blockSlot", slotId: "attract_repel_table" }
	],
	interactions: {
		text_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TEXT_ENTRY", expectedLength: 10 }
	},
	feedbackBlocks: [
		{
			identifier: "CORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{ type: "paragraph", content: [{ type: "text", content: "Correct! Likes repel and opposites attract." }] }
			]
		},
		{
			identifier: "INCORRECT",
			outcomeIdentifier: "FEEDBACK__GLOBAL",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Not quite. Remember: like charges/poles repel; opposite charges/poles attract." }
					]
				}
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
		{ type: "blockSlot", slotId: "shapes_table" },
		{ type: "blockSlot", slotId: "choice_interaction" }
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
					content: [{ type: "blockSlot", slotId: "chart_a" }]
				},
				{
					identifier: "B",
					content: [{ type: "blockSlot", slotId: "chart_b" }]
				},
				{
					identifier: "C",
					content: [{ type: "blockSlot", slotId: "chart_c" }]
				},
				{
					identifier: "D",
					content: [{ type: "blockSlot", slotId: "chart_d" }]
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
		{ type: "blockSlot", slotId: "choice_interaction" }
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
					content: [{ type: "blockSlot", slotId: "plot_a" }]
				},
				{
					identifier: "B",
					content: [{ type: "blockSlot", slotId: "plot_b" }]
				},
				{
					identifier: "C",
					content: [{ type: "blockSlot", slotId: "plot_c" }]
				},
				{
					identifier: "D",
					content: [{ type: "blockSlot", slotId: "plot_d" }]
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
		{ type: "blockSlot", slotId: "games_chart" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "How many games did the Lions win? " },
				{ type: "inlineSlot", slotId: "text_entry" }
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
						{ type: "text", content: "Correct! The Lions won " },
						{ type: "math", mathml: "<mn>14</mn>" },
						{ type: "text", content: " games." }
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
						{ type: "text", content: "Not quite. Find the Lions bar and see where it reaches on the vertical axis." }
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
		}
	},
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "The heights of Sabrina's dolls are shown below." }]
		},
		{ type: "blockSlot", slotId: "doll_plot" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "How many dolls are taller than " },
				{ type: "math", mathml: "<mn>22</mn>" },
				{ type: "text", content: " centimeters? " },
				{ type: "inlineSlot", slotId: "text_entry" }
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
						{ type: "text", content: "Correct! " },
						{ type: "math", mathml: "<mn>5</mn>" },
						{ type: "text", content: " dolls are taller than " },
						{ type: "math", mathml: "<mn>22</mn><mtext> cm</mtext>" },
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
						{ type: "text", content: "Not quite. Count all the dots that are to the right of " },
						{ type: "math", mathml: "<mn>22</mn>" },
						{ type: "text", content: " on the line plot." }
					]
				}
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
		}
	},
	body: [
		{
			type: "paragraph",
			content: [{ type: "text", content: "Look at the following number line." }]
		},
		{ type: "blockSlot", slotId: "time_line" },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "What time is shown on the number line? " },
				{ type: "inlineSlot", slotId: "hour_entry" },
				{ type: "text", content: ":" },
				{ type: "inlineSlot", slotId: "minute_entry" }
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
					content: [{ type: "text", content: "Correct! The time shown is 12:55." }]
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
							content: "Not quite. Point A is located after the 12:00 mark but before the 1:00 mark. The time is 12:55."
						}
					]
				}
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
				{ type: "inlineSlot", slotId: "comparison" },
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
						{ type: "text", content: "Correct! " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " is greater than " },
						{ type: "math", mathml: "<mn>58</mn>" },
						{ type: "text", content: ", so the correct symbol is " },
						{ type: "math", mathml: "<mo>&gt;</mo>" },
						{ type: "text", content: "." }
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
						{ type: "text", content: "Not quite. Since " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " is larger than " },
						{ type: "math", mathml: "<mn>58</mn>" },
						{ type: "text", content: ", the correct comparison is " },
						{ type: "math", mathml: "<mn>83</mn><mo>&gt;</mo><mn>58</mn>" },
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
						{ type: "text", content: "Not quite. Since " },
						{ type: "math", mathml: "<mn>83</mn>" },
						{ type: "text", content: " is larger than " },
						{ type: "math", mathml: "<mn>58</mn>" },
						{ type: "text", content: ", the correct comparison is " },
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
		{ type: "blockSlot", slotId: "text_entry_interaction_1" }
	],
	interactions: {
		text_entry_interaction_1: {
			type: "textEntryInteraction",
			responseIdentifier: "RESPONSE",
			expectedLength: 3
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
					content: [
						{ type: "text", content: "Correct! The greatest common factor of " },
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mn>75</mn>" },
						{ type: "text", content: " is " },
						{ type: "math", mathml: "<mn>15</mn>" },
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
						{
							type: "text",
							content: "Not quite. Remember to find the largest number that divides both "
						},
						{ type: "math", mathml: "<mn>30</mn>" },
						{ type: "text", content: " and " },
						{ type: "math", mathml: "<mn>75</mn>" },
						{
							type: "text",
							content:
								" without a remainder. The factors of 30 are 1, 2, 3, 5, 6, 10, 15, 30. The factors of 75 are 1, 3, 5, 15, 25, 75. The greatest common factor is "
						},
						{ type: "math", mathml: "<mn>15</mn>" },
						{ type: "text", content: "." }
					]
				}
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
		{ type: "blockSlot", slotId: "table_q1" },
		{ type: "blockSlot", slotId: "choice_q1" },
		{ type: "blockSlot", slotId: "table_q2" },
		{ type: "blockSlot", slotId: "choice_q2" },
		{ type: "blockSlot", slotId: "table_q3" },
		{ type: "blockSlot", slotId: "choice_q3" }
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
			content: [{ type: "paragraph", content: [{ type: "text", content: "Check the fruit counts carefully." }] }]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q1",
			content: [{ type: "paragraph", content: [{ type: "text", content: "Correct for Q1." }] }]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q1",
			content: [{ type: "paragraph", content: [{ type: "text", content: "Check the fruit counts carefully." }] }]
		},

		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q2",
			content: [{ type: "paragraph", content: [{ type: "text", content: "Compare all three city readings." }] }]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q2",
			content: [{ type: "paragraph", content: [{ type: "text", content: "Compare all three city readings." }] }]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q2",
			content: [{ type: "paragraph", content: [{ type: "text", content: "Correct for Q2." }] }]
		},

		{
			identifier: "A",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q3",
			content: [{ type: "paragraph", content: [{ type: "text", content: "Look at the minutes column." }] }]
		},
		{
			identifier: "B",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q3",
			content: [{ type: "paragraph", content: [{ type: "text", content: "Look at the minutes column." }] }]
		},
		{
			identifier: "C",
			outcomeIdentifier: "FEEDBACK__RESPONSE_Q3",
			content: [{ type: "paragraph", content: [{ type: "text", content: "Correct for Q3." }] }]
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
		}
	},
	body: [
		{ type: "blockSlot", slotId: "gustave_shoe_image" },
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
		{ type: "paragraph", content: [{ type: "inlineSlot", slotId: "equation_entry" }] },
		{
			type: "paragraph",
			content: [
				{ type: "text", content: "How many steps are in one mile for Gustave? " },
				{ type: "inlineSlot", slotId: "steps_entry" }
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
						{ type: "text", content: "Correct! A valid equation is " },
						{ type: "math", mathml: "<mn>3</mn><mi>s</mi><mo>=</mo><mn>6300</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "There are " },
						{ type: "math", mathml: "<mn>2100</mn>" },
						{ type: "text", content: " steps in one mile for Gustave." }
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
						{ type: "text", content: "Not quite. Let " },
						{ type: "math", mathml: "<mi>s</mi>" },
						{ type: "text", content: " be the number of steps in one mile. Since " },
						{ type: "math", mathml: "<mn>3</mn>" },
						{ type: "text", content: " miles corresponds to " },
						{ type: "math", mathml: "<mn>6300</mn>" },
						{ type: "text", content: " steps, the equation is " },
						{ type: "math", mathml: "<mn>3</mn><mi>s</mi><mo>=</mo><mn>6300</mn>" },
						{ type: "text", content: "." }
					]
				},
				{
					type: "paragraph",
					content: [
						{ type: "text", content: "Solving gives " },
						{ type: "math", mathml: "<mi>s</mi><mo>=</mo><mn>2100</mn>" },
						{ type: "text", content: ", so there are 2100 steps in one mile." }
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
				{ type: "inlineSlot", slotId: "comparison_dropdown" },
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
			content: [{ type: "paragraph", content: [{ type: "text", content: "Correct! -4.1 is greater than -√20." }] }]
		},
		{
			identifier: "LT",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "Not quite. √20≈4.47, so -4.1 is greater (less negative)." }]
				}
			]
		},
		{
			identifier: "EQ",
			outcomeIdentifier: "FEEDBACK__RESPONSE",
			content: [
				{ type: "paragraph", content: [{ type: "text", content: "Not equal; compare the magnitudes carefully." }] }
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
			type: "blockSlot",
			slotId: "reaction_rate_table"
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
			type: "blockSlot",
			slotId: "image_2"
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
			type: "blockSlot",
			slotId: "image_3"
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
					type: "inlineSlot",
					slotId: "dropdown_1"
				},
				{
					type: "text",
					content: ". If an object's mass is cut in half while its speed stays the same, its kinetic energy becomes "
				},
				{
					type: "inlineSlot",
					slotId: "dropdown_3"
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
					type: "inlineSlot",
					slotId: "dropdown_2"
				},
				{
					type: "text",
					content: ". If an object's speed is cut in half while its mass stays the same, its kinetic energy becomes "
				},
				{
					type: "inlineSlot",
					slotId: "dropdown_5"
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
			type: "blockSlot",
			slotId: "image_1"
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
			type: "blockSlot",
			slotId: "react_temp_table"
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
						{ type: "text", content: "Correct! You used the patterns in the data to match each unknown entry." }
					]
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							content:
								"Experiment C has twice the amount of sodium acetate as experiment A, so its temperature change is twice as large and negative: "
						},
						{ type: "math", mathml: "<mo>-</mo><mn>3.2</mn><mo>°</mo><mi>C</mi>" },
						{ type: "text", content: ". Experiment D corresponds to " },
						{ type: "math", mathml: "<mrow><mi>K</mi><mi>O</mi><mi>H</mi></mrow>" },
						{ type: "text", content: " with a temperature increase of " },
						{ type: "math", mathml: "<mo>+</mo><mn>4.2</mn><mo>°</mo><mi>C</mi>" },
						{ type: "text", content: ", and experiment E corresponds to " },
						{
							type: "math",
							mathml: "<mrow><mi>Ba</mi><msub><mrow><mo>(</mo><mi>OH</mi><mo>)</mo></mrow><mn>2</mn></msub></mrow>"
						},
						{ type: "text", content: " with a temperature increase of " },
						{ type: "math", mathml: "<mo>+</mo><mn>2.0</mn><mo>°</mo><mi>C</mi>" },
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
						{
							type: "text",
							content:
								"Not quite. First, decide which reactions are endothermic (temperature decreases) and which are exothermic (temperature increases). Then use how the amount changes (for example, twice as much) to match proportional changes in temperature."
						}
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
