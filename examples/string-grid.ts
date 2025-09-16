import type { StringGridProps } from "../src/widgets/generators/string-grid"

export const stringGridExamples: StringGridProps[] = [
    {
        type: "stringGrid",
        width: 520,
        height: 120,
        rows: 1,
        cols: 4,
        data: [["1 1/2", "0", "4", "2 1/2"]],
        showGridLines: true,
        fontPx: 18
    },
    {
        type: "stringGrid",
        width: 320,
        height: 220,
        rows: 2,
        cols: 3,
        data: [
            ["0.3", "0.6", "0.5"],
            ["1", "0.4", "0.8"]
        ],
        showGridLines: true,
        fontPx: 16
    }
]


