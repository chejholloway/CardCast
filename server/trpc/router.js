import { router } from "./base";
import { ogRouter } from "./routers/og";
import { postRouter } from "./routers/post";
import { authRouter } from "./routers/auth";
export const appRouter = router({
    og: ogRouter,
    post: postRouter,
    auth: authRouter
});
