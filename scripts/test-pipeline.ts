// scripts/test-pipeline.ts
import { config } from "dotenv";
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import * as errors from "@superbuilders/errors";
import {
    generateFromEnvelope
} from "@superbuilders/qti-assessment-item-generator/structured";
import {
    compile
} from "@superbuilders/qti-assessment-item-generator/compiler";
import {
    buildPerseusEnvelope
} from "@superbuilders/qti-assessment-item-generator/structured/ai-context-builder";

// Load environment variables from .env file
const envResult = errors.trySync(() => config());
if (envResult.error) {
    logger.error("failed to load .env file", { error: envResult.error });
    throw errors.wrap(envResult.error, "environment configuration");
}

// Check if the OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
    logger.error("missing required environment variable", { variable: "OPENAI_API_KEY" });
    throw errors.new("OPENAI_API_KEY environment variable is not set - please create a .env file and add your key: OPENAI_API_KEY=\"your-key-here\"");
}

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

logger.setDefaultLogLevel(logger.DEBUG);

// A specific Perseus JSON fixture for testing the pipeline
const perseusData = {
    "hints": [],
    "question": {
        "images": {
            "https://cdn.kastatic.org/ka-perseus-images/082e6068e0c842e2b09e2a8520bd22817d55a134.svg": {
                "width": 600,
                "height": 371
            }
        },
        "content": "Examine the chart and answer the question below.\n\n![Chart showing immigrant share of total US population from 1900 to 2000...](https://cdn.kastatic.org/ka-perseus-images/082e6068e0c842e2b09e2a8520bd22817d55a134.svg)\n\n>Source: U.S. Census Bureau...\n\n**A development related to the overall trend from 1920 to 1970 depicted on the graph was the:**\n\n[[☃ radio 1]]",
        "widgets": {
            "radio 1": {
                "type": "radio",
                "graded": true,
                "options": {
                    "choices": [{
                        "content": "implementation of a national origins quota on incoming immigrants.",
                        "correct": true
                    }, {
                        "content": "failing economy after a major stock market crash and deflation of the US dollar.",
                        "correct": false
                    }, {
                        "content": "widespread destruction of infrastructure following World War II. ",
                        "isNoneOfTheAbove": false
                    }, {
                        "content": "investigation and deportation of people associated with the Communist Party.",
                        "isNoneOfTheAbove": false
                    }],
                    "randomize": true
                }
            }
        }
    }
};


/**
 * Main function to execute the QTI generation pipeline.
 */
async function runTestPipeline() {
    console.log("🚀 Starting Perseus to QTI pipeline test...");

    try {
        // 1. Build the AI context envelope from the source data.
        logger.info("Step 1: Building AI context envelope from Perseus JSON.");
        const envelope = await buildPerseusEnvelope(logger, perseusData);
        logger.info("Envelope created successfully.");

        // 2. Generate the structured AssessmentItemInput object.
        logger.info("Step 2: Generating structured item from envelope using AI.");
        const structuredItem = await generateFromEnvelope(openai, logger, envelope, "math-core");
        logger.info("Structured item generated successfully.");

        // 3. Compile the structured item to QTI XML.
        logger.info("Step 3: Compiling structured item to QTI XML.");
        const xml = await compile(logger, structuredItem);
        logger.info("Compilation successful.");

        // 4. Print the final result.
        console.log("\n✅ Pipeline Test Succeeded!");
        console.log("\n✨ Generated QTI 3.0 XML ✨\n");
        console.log("========================================");
        console.log(xml);
        console.log("========================================");

    } catch (error) {
        console.error("\n❌ Pipeline Test Failed!");
        logger.error("An error occurred during the pipeline test", {
            error
        });
        process.exit(1);
    }
}

// Execute the main function
runTestPipeline();
