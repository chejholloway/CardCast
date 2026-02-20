import { router } from './base';
import { ogRouter } from './routers/og';
import { postRouter } from './routers/post';
import { authRouter } from './routers/auth';
import { profileRouter } from './routers/profile';

export const appRouter = router({
  og: ogRouter,
  post: postRouter,
  auth: authRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
