import type { DataTableProps } from "../src/widgets/generators/data-table"

export const dataTableExamples: DataTableProps[] = [
	{
		type: "dataTable",
		title: "Student Test Scores",
		columns: [
			{
				key: "name",
				label: [{ type: "text", content: "Student Name" }],
				isNumeric: false
			},
			{
				key: "math",
				label: [{ type: "text", content: "Math Score" }],
				isNumeric: true
			},
			{
				key: "reading",
				label: [{ type: "text", content: "Reading Score" }],
				isNumeric: true
			}
		],
		data: [
			[
				{ type: "inline", content: [{ type: "text", content: "Alice" }] },
				{ type: "number", value: 95 },
				{ type: "number", value: 88 }
			],
			[
				{ type: "inline", content: [{ type: "text", content: "Bob" }] },
				{ type: "number", value: 82 },
				{ type: "number", value: 91 }
			],
			[
				{ type: "inline", content: [{ type: "text", content: "Charlie" }] },
				{ type: "number", value: 78 },
				{ type: "number", value: 85 }
			]
		],
		rowHeaderKey: null,
		footer: null
	},
	{
		type: "dataTable",
		title: "Pet Survey Results",
		columns: [
			{
				key: "pet",
				label: [{ type: "text", content: "Pet Type" }],
				isNumeric: false
			},
			{
				key: "count",
				label: [{ type: "text", content: "Number of Students" }],
				isNumeric: true
			}
		],
		data: [
			[
				{ type: "inline", content: [{ type: "text", content: "Dogs" }] },
				{ type: "number", value: 12 }
			],
			[
				{ type: "inline", content: [{ type: "text", content: "Cats" }] },
				{ type: "number", value: 8 }
			],
			[
				{ type: "inline", content: [{ type: "text", content: "Fish" }] },
				{ type: "number", value: 5 }
			],
			[
				{ type: "inline", content: [{ type: "text", content: "Birds" }] },
				{ type: "number", value: 3 }
			]
		],
		rowHeaderKey: null,
		footer: null
	}
]
