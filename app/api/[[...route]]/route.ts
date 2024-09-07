import { Hono } from "hono";
import { handle } from "hono/vercel";
// import { z } from "zod";
// import { zValidator } from "@hono/zod-validator";
import accounts from "./accounts";

export const runtime = "edge";
const app = new Hono().basePath("/api");

// https://hono.dev/docs/guides/rpc#using-rpc-with-larger-applications
const routes = app.route("/accounts", accounts);

// app
//   .get("/hello", clerkMiddleware(), (c) => {
//     const auth = getAuth(c);

//     if (!auth?.userId) {
//       return c.json({
//         error: "Unauthorized",
//       });
//     }

//     return c.json({
//       message: "Hello Next.js!",
//       userId: auth.userId,
//     });
//   })
//   .get(
//     "/hello/:test",
//     zValidator(
//       "param",
//       z.object({
//         test: z.number(),
//       })
//     ),
//     (c) => {
//       const { test } = c.req.valid("param");

//       return c.json({
//         message: `Hello ${test}!`,
//       });
//     }
//   );

export const GET = handle(app);
export const POST = handle(app);

export type AppType = typeof routes;
