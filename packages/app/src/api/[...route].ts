import { handle } from "hono/vercel"
import app from "../index"

export const config = {
	runtime: "bun@1.x"
}

export default handle(app)
