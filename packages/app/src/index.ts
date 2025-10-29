import "./env"
import { Hono } from "hono"
import { serve } from "inngest/hono"
import { inngest } from "./inngest/client"
import { functions } from "./inngest/functions"

const app = new Hono()

app.on(
	["GET", "PUT", "POST"],
	"/api/inngest",
	serve({ client: inngest, functions })
)

export default app
