import { handle } from "hono/vercel"
import app from "../index"

export const config = {
	runtime: "nodejs22.x"
}

export default handle(app)
