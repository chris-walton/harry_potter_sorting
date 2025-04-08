import { Hono } from "hono";
import { cors } from 'hono/cors';
import type { Variables } from "./config";
import { AudioService, ElevenLabsService } from "./services";

const app = new Hono<{ Bindings: CfEnv; Variables: Variables }>();

app.use("*", async (ctx, next) => {
  const elevenLabs = new ElevenLabsService(ctx.env);
  const audio = new AudioService(elevenLabs, ctx.env.KV_DATA);

  ctx.set("elevenLabs", elevenLabs);
  ctx.set("audio", audio);
  await next();
});

app.use('*', (c, n) => cors({
  origin: 'http://localhost:4200',
  allowHeaders: ['authorization', 'content-type', 'force-refresh', 'x-filename'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
})(c, n));

app.options("api/*", (c) => c.text(""));
app.get("api/text/:text", async (ctx) => {
  const text = ctx.req.param('text');
  const audio = await ctx.var.audio.getAudio(text);

  console.log(audio.byteLength);
  return ctx.body(audio, {
    headers: { "Content-Type": "audio/mpeg" },
  });
});

app.post("api/verify", async (ctx) => {
  const texts = await ctx.req.json();

  await ctx.var.audio.verifyAll(texts);

  return ctx.newResponse(null, 204);
});

export const APP_ROUTES = app;
