import type { ThreeDIntersectionDiagramProps } from "../src/widgets/generators/3d-intersection-diagram"

export const threeDIntersectionDiagramExamples: ThreeDIntersectionDiagramProps[] = [
  {
    "type": "threeDIntersectionDiagram",
    "plane": {
      "position": 0.5,
      "orientation": "vertical"
    },
    "solid": {
      "type": "squarePyramid",
      "height": 6,
      "baseSide": 10
    },
    "width": 300,
    "height": 182,
    "viewOptions": {
      "showLabels": false,
      "projectionAngle": 30,
      "showHiddenEdges": true,
      "intersectionColor": "#11accd"
    }
  },
  {
    "type": "threeDIntersectionDiagram",
    "plane": {
      "position": 0.5,
      "orientation": "vertical"
    },
    "solid": {
      "type": "rectangularPrism",
      "depth": 8,
      "width": 4,
      "height": 4
    },
    "width": 500,
    "height": 350,
    "viewOptions": {
      "showLabels": false,
      "projectionAngle": 30,
      "showHiddenEdges": true,
      "intersectionColor": "#FF6B6B80"
    }
  },
  {
    "type": "threeDIntersectionDiagram",
    "plane": {
      "position": 0.5,
      "orientation": "vertical"
    },
    "solid": {
      "type": "cone",
      "height": 10,
      "radius": 6
    },
    "width": 500,
    "height": 350,
    "viewOptions": {
      "showLabels": false,
      "projectionAngle": 30,
      "showHiddenEdges": true,
      "intersectionColor": "#11accd"
    }
  },
  {
    "type": "threeDIntersectionDiagram",
    "plane": {
      "position": 0.3,
      "orientation": "vertical"
    },
    "solid": {
      "type": "squarePyramid",
      "height": 10,
      "baseSide": 8
    },
    "width": 520,
    "height": 380,
    "viewOptions": {
      "showLabels": false,
      "projectionAngle": 30,
      "showHiddenEdges": true,
      "intersectionColor": "#ffcc66"
    }
  },
  {
    "type": "threeDIntersectionDiagram",
    "plane": {
      "position": 0.5,
      "orientation": "vertical"
    },
    "solid": {
      "type": "rectangularPrism",
      "depth": 2,
      "width": 2,
      "height": 4
    },
    "width": 500,
    "height": 350,
    "viewOptions": {
      "showLabels": false,
      "projectionAngle": 30,
      "showHiddenEdges": true,
      "intersectionColor": "#11accd"
    }
  }
]