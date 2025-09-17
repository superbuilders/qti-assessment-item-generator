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
      "height": 300,
      "baseSide": 10
    },
    "width": 300,
    "height": 300,
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
      "width": 300,
      "height": 300
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
      "height": 300,
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
      "height": 300,
      "baseSide": 8
    },
    "width": 500,
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
      "width": 300,
      "height": 300
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
      "position": 0.6,
      "orientation": "vertical"
    },
    "solid": {
      "type": "octagonalPrism",
      "side": 3,
      "height": 300
    },
    "width": 400,
    "height": 350,
    "viewOptions": {
      "showLabels": false,
      "projectionAngle": 30,
      "showHiddenEdges": false,
      "intersectionColor": "#9b59b6"
    }
  }
]