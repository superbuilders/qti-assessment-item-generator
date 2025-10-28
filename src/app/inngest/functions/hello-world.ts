import { inngest } from "../client"

export const helloWorldFunction = inngest.createFunction(
	{ id: "hello-world", name: "template.hello-world" },
	{ event: "template/hello" },
	async ({ event, logger }) => {
		logger.info("Hello from Inngest!", {
			requestId: event.data.requestId,
			message: event.data.message
		})

		return {
			acknowledged: true
		}
	}
)
