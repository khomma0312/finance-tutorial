import { Hono } from "hono";
import { handle } from "hono/vercel";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const runtime = "edge";
const app = new Hono().basePath("/api");
app.use("*", clerkMiddleware());

// 以下に沿ってAPIを構築する
// https://hono.dev/docs/guides/rpc#using-rpc-with-larger-applications

app
  .get("/hello", clerkMiddleware(), (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({
        error: "Unauthorized",
      });
    }

    return c.json({
      message: "Hello Next.js!",
      userId: auth.userId,
    });
  })
  .get(
    "/hello/:test",
    zValidator(
      "param",
      z.object({
        test: z.number(),
      })
    ),
    (c) => {
      const { test } = c.req.valid("param");

      return c.json({
        message: `Hello ${test}!`,
      });
    }
  );

export const GET = handle(app);
export const POST = handle(app);
