import { Hono } from "hono";
import { handle } from "hono/vercel";
// import { z } from "zod";
// import { zValidator } from "@hono/zod-validator";
import accounts from "./accounts";

export const runtime = "edge";
const app = new Hono().basePath("/api");

// https://hono.dev/docs/guides/rpc#using-rpc-with-larger-applications
const routes = app.route("/accounts", accounts);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
