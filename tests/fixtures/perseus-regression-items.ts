// tests/fixtures/perseus-regression-items.ts

export const soupVolumeEstimation = {
	hints: [
		{
			images: {},
			content:
				"Measure | Volume \n:- | :- \nCup | About the volume of a juice box\nPint | About the volume of a water bottle \nQuart | About the volume of a large shampoo bottle \nGallon |  About the volume of a milk jug ",
			replace: false,
			widgets: {}
		},
		{
			images: {},
			content: "Is the volume of a bowl of soup closer to $3$ cups or $3$ quarts?",
			replace: false,
			widgets: {}
		},
		{ images: {}, content: "The volume of a bowl of soup is about $3$ cups.", replace: false, widgets: {} }
	],
	question: {
		images: {},
		content: "**Which is closer to the volume of a bowl of soup?**\n\n\n[[☃ radio 1]]\n\n\n\n[[☃ image 1]]\n\n",
		widgets: {
			"image 1": {
				type: "image",
				graded: true,
				static: false,
				options: {
					alt: "A bowl of soup.",
					box: [155, 174],
					range: [
						[0, 10],
						[0, 10]
					],
					title: "",
					labels: [],
					static: false,
					caption: "",
					backgroundImage: {
						url: "https://cdn.kastatic.org/ka-perseus-images/6e97b6fb3b6e4db8bd10c2bad63a40d7ba4b8d05.svg",
						width: 155,
						height: 174
					}
				},
				version: { major: 0, minor: 0 },
				alignment: "block"
			},
			"radio 1": {
				type: "radio",
				graded: true,
				static: false,
				options: {
					choices: [
						{ content: "$3$ cups ", correct: true },
						{ content: "$3$ quarts ", correct: false }
					],
					randomize: true,
					countChoices: false,
					displayCount: null,
					multipleSelect: false,
					deselectEnabled: false,
					hasNoneOfTheAbove: false
				},
				version: { major: 1, minor: 0 },
				alignment: "default"
			}
		}
	},
	answerArea: { tTable: false, zTable: false, chi2Table: false, calculator: false, periodicTable: false },
	itemDataVersion: { major: 0, minor: 1 }
}

export const rectangularPrismVolume = {
	hints: [
		{
			images: {},
			content: "We want to know how many one-centimeter cubes can we fit in the prism.",
			replace: false,
			widgets: {}
		},
		{
			images: {},
			content:
				"### Step 1: Find the area of the base\n\nFirst, let's figure out how many fit at the bottom (base) of the shape.\n\n\n\n[[☃ image 1]]\n\nWe can fit $6\\times 5=30$ unit cubes at the base.\n\n**Note:** The base of this prism is a rectangle, which is why we call it a rectangular prism. The area of the base is $30 \\text{ cm}^2$.",
			replace: false,
			widgets: {
				"image 1": {
					type: "image",
					graded: true,
					static: false,
					options: {
						alt: "A rectangular prism. The base is 6 centimeters long and 5 centimeters wide. The height is 7 centimeters high. There is one centimeter cube located on the front face at the base. Lines are drawn on the rest of the base to show 5 rows and 6 columns. ",
						box: [242, 240],
						range: [
							[0, 10],
							[0, 10]
						],
						title: "",
						labels: [],
						static: false,
						caption: "",
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/cac56ae8f5ba80ce51f2b70808db25a9e804f7d0",
							width: 242,
							height: 240
						}
					},
					version: { major: 0, minor: 0 },
					alignment: "block"
				}
			}
		},
		{
			images: {},
			content:
				"### Step 2: Multiply by the height of the prism\n\nOne layer of cubes has $30$ cubes. But, how many layers fit in the prism?\n\n\n\n[[☃ image 1]]\n\n",
			replace: false,
			widgets: {
				"image 1": {
					type: "image",
					graded: true,
					static: false,
					options: {
						alt: "A rectangular prism. The height is 7 centimeters. The base is shown as a layer of centimeter cubes arranged in 5 rows and 6 columns.",
						box: [240, 221],
						range: [
							[0, 10],
							[0, 10]
						],
						title: "",
						labels: [],
						static: false,
						caption: "",
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/f34d67f81842a62ece99f213ae1c892d1230aa88",
							width: 240,
							height: 221
						}
					},
					version: { major: 0, minor: 0 },
					alignment: "block"
				}
			}
		},
		{
			images: {},
			content:
				"We can fit $7$ layers of cubes in the prism because its height is $7\\text{ cm}$.\n\nMultiplying, we get\n\n$30\\times 7=210$ cubes\n\nwhich means the volume of the prism is $210\\text{ cm}^3$.\n\n\n\n[[☃ image 1]]\n\n",
			replace: false,
			widgets: {
				"image 1": {
					type: "image",
					graded: true,
					static: false,
					options: {
						alt: "A rectangular prism made up of centimeter cubes. The front face of a rectangular prism shows 42 cubes: 7 rows and 6 columns. The top face of the cube shows 30 cubes: 5 rows and 6 columns. The right slice shows 35 cubes: 7 rows and 5 columns. The length of the rectangular prism is 6 centimeters. The width of the rectangular prism is 5 centimeters. The height of the rectangular prism is 7 centimeters. ",
						box: [221, 240],
						range: [
							[0, 10],
							[0, 10]
						],
						title: "",
						labels: [],
						static: false,
						caption: "",
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/3249adbd4159cc27529db2f6ad8c730f0e85d263",
							width: 221,
							height: 240
						}
					},
					version: { major: 0, minor: 0 },
					alignment: "block"
				}
			}
		},
		{ images: {}, content: "The answer:\n\n$210 \\text{ cm}^3$", replace: false, widgets: {} }
	],
	question: {
		images: {},
		content:
			"**What is the volume of the rectangular prism?**\n\n\n\n[[☃ image 1]]\n\n[[☃ numeric-input 1]] $\\text{cm}^3$\n",
		widgets: {
			"image 1": {
				type: "image",
				graded: true,
				static: false,
				options: {
					alt: "A rectangular prism. The base is 6 centimeters long and 5 centimeters wide. The height is 7 centimeters high. ",
					box: [242, 240],
					range: [
						[0, 10],
						[0, 10]
					],
					title: "",
					labels: [],
					static: false,
					caption: "",
					backgroundImage: {
						url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/dd95b3ba963716c4eab2e3429df264ad09ee1200",
						width: 242,
						height: 240
					}
				},
				version: { major: 0, minor: 0 },
				alignment: "block"
			},
			"numeric-input 1": {
				type: "numeric-input",
				graded: true,
				static: false,
				options: {
					size: "normal",
					static: false,
					answers: [
						{ value: 210, status: "correct", strict: false, message: "", maxError: null, simplify: "required" }
					],
					labelText: "",
					rightAlign: false,
					coefficient: false,
					multipleNumberInput: false
				},
				version: { major: 0, minor: 0 },
				alignment: "default"
			}
		}
	},
	answerArea: { tTable: false, zTable: false, chi2Table: false, calculator: false, periodicTable: false },
	itemDataVersion: { major: 0, minor: 1 }
}

export const numberLineMatcher = {
	hints: [
		{
			images: {},
			content: "First, let's show $n-q$ on the number line.  \n\n[[☃ image 1]]\n\n",
			replace: false,
			widgets: {
				"image 1": {
					type: "image",
					graded: true,
					static: false,
					options: {
						alt: "A number line with evenly spaced ticks from negative 5 to 5 in increments of 1. Negative 4, negative 3 and negative 1 are highlighted by filled points. Negative 4 is labeled as n, negative 3 labeled as n minus q and negative 1 is labeled as q above the number line.\n",
						box: [460, 69],
						range: [
							[0, 10],
							[0, 10]
						],
						title: "",
						labels: [],
						static: false,
						caption: "",
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/22d2f8318fdc99ad1ba3744dbd4c83231654cda9",
							width: 460,
							height: 69
						}
					},
					version: { major: 0, minor: 0 },
					alignment: "block"
				}
			}
		},
		{
			images: {},
			content: "Now, let's show $q-n$ on the number line.  \n\n[[☃ image 1]]\n\n",
			replace: false,
			widgets: {
				"image 1": {
					type: "image",
					graded: true,
					static: false,
					options: {
						alt: "A number line with evenly spaced ticks from negative 5 to 5 in increments of 1. Negative 4, negative 3, negative 1 and 3 are highlighted by filled points. Negative 4 is labeled as n, negative 3 labeled as n minus q, negative 1 is labeled as q and 3 is labeled as q minus n above the number line.\n",
						box: [460, 69],
						range: [
							[0, 10],
							[0, 10]
						],
						title: "",
						labels: [],
						static: false,
						caption: "",
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/6d1cad8cdce07fe3fad6e9ef7fd3f26a99a05b34",
							width: 460,
							height: 69
						}
					},
					version: { major: 0, minor: 0 },
					alignment: "block"
				}
			}
		},
		{
			images: {},
			content:
				"The given expressions are categorized by their values below. \n\n|||\n:-: || :-: \nLeast Value|| $n-q$  \nGreatest Value|| $q-n$  \nClosest to zero|| $q$  ",
			replace: false,
			widgets: {}
		}
	],
	question: {
		images: {},
		content: "**Match each expression with the correct description.**\n\n[[☃ image 1]]\n\n\n\n[[☃ matcher 1]]\n\n\n\n",
		widgets: {
			"image 1": {
				type: "image",
				graded: true,
				static: false,
				options: {
					alt: "A number line with evenly spaced ticks from negative 5 to 5 in increments of 1. Negative 4 and negative 1 are highlighted by filled points. Negative 4 is labeled as n and negative 1 is labeled as q above the number line.\n",
					box: [460, 69],
					range: [
						[0, 10],
						[0, 10]
					],
					title: "",
					labels: [],
					static: false,
					caption: "",
					backgroundImage: {
						url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/ab37c0475a4b8fb4e300bae5a1a72762992906b8",
						width: 460,
						height: 69
					}
				},
				version: { major: 0, minor: 0 },
				alignment: "block"
			},
			"matcher 1": {
				type: "matcher",
				graded: true,
				static: false,
				options: {
					left: ["Least value", "Greatest value", "Closest to zero"],
					right: ["$n-q$", "$q - n$", "$q$"],
					labels: ["Description", "Expression"],
					padding: true,
					orderMatters: false
				},
				version: { major: 0, minor: 0 },
				alignment: "default"
			}
		}
	},
	answerArea: {
		tTable: false,
		zTable: false,
		chi2Table: false,
		calculator: false,
		periodicTable: false,
		periodicTableWithKey: false,
		financialCalculatorTotalAmount: false,
		financialCalculatorTimeToPayOff: false,
		financialCalculatorMonthlyPayment: false
	},
	itemDataVersion: { major: 0, minor: 1 }
}

export const interactiveGraphPlotting = {
	hints: [
		{
			images: {},
			content:
				"###Graphing the first point\n\nTo graph a line, we need to find two points that are on it. Then we can drag the movable points to those points.\n\nWe already have one point, $(2,-6)$, and we can use the slope of the line to find another point.\n\n[[☃ image 1]]",
			replace: false,
			widgets: {
				"image 1": {
					type: "image",
					graded: true,
					static: false,
					options: {
						alt: "A coordinate plane. The x- and y-axes each scale by one. The point two, negative six is plotted and labeled.",
						box: [345, 345],
						range: [
							[0, 10],
							[0, 10]
						],
						title: "",
						labels: [],
						static: false,
						caption: "",
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/9c39594b22dda7550b172d2fabdace645cba00ad",
							width: 345,
							height: 345
						}
					},
					version: { major: 0, minor: 0 },
					alignment: "block"
				}
			}
		},
		{
			images: {},
			content:
				"###Use the slope to graph another point\n\nWe want the slope to be $\\dfrac65$. Let's look at this slope as a fraction to help us graph the line:\n\n$\\text{slope}=\\dfrac{\\purpleD{\\text{rise}}}{\\maroonD{\\text{run}}}=\\dfrac{\\purpleD{\\Delta y}}{\\maroonD{\\Delta x}}=\\dfrac{\\purpleD{6}}{\\maroonD{5}}$\n\nStarting at $(2,-6)$, let's go $\\purpleD{6\\text{ units up}}$ and $\\maroonD{5\\text{ units to the right}}$ to plot another point on the line:\n\n[[☃ image 1]]",
			replace: false,
			widgets: {
				"image 1": {
					type: "image",
					graded: true,
					static: false,
					options: {
						alt: "A coordinate plane. The x- and y-axes each scale by one. The points two, negative six and seven, zero are plotted and labeled. There is a vertical dotted segment from two, negative six to two, zero that is labeled six. There is a horizontal dotted segment from two, zero to seven, zero that is labeled five.",
						box: [345, 345],
						range: [
							[0, 10],
							[0, 10]
						],
						title: "",
						labels: [],
						static: false,
						caption: "",
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/776abaabc71f64c5fce9ad6b1ee1c0f28079b3a8",
							width: 345,
							height: 345
						}
					},
					version: { major: 0, minor: 0 },
					alignment: "block"
				}
			}
		}
	],
	question: {
		images: {},
		content: "**Graph a line with a slope of $\\dfrac65$ that contains the point $(2,-6)$.**\n\n[[☃ grapher 1]]",
		widgets: {
			"grapher 1": {
				type: "grapher",
				graded: true,
				static: false,
				options: {
					graph: {
						step: [1, 1],
						range: [
							[-8, 8],
							[-8, 8]
						],
						valid: true,
						labels: ["x", "y"],
						gridStep: [1, 1],
						markings: "graph",
						snapStep: [1, 1],
						showRuler: false,
						rulerLabel: "",
						rulerTicks: 10,
						showTooltips: true,
						showProtractor: false,
						backgroundImage: { url: null },
						editableSettings: ["graph", "snap", "image"]
					},
					correct: {
						type: "linear",
						coords: [
							[2, -6],
							[7, 0]
						]
					},
					availableTypes: ["linear"]
				},
				version: { major: 0, minor: 0 },
				alignment: "default"
			}
		}
	},
	answerArea: {
		tTable: false,
		zTable: false,
		chi2Table: false,
		calculator: false,
		periodicTable: false,
		periodicTableWithKey: false,
		financialCalculatorTotalAmount: false,
		financialCalculatorTimeToPayOff: false,
		financialCalculatorMonthlyPayment: false
	},
	itemDataVersion: { major: 0, minor: 1 }
}
