import { Hono } from "hono";


const app = new Hono<{ Bindings: CfEnv; Variables: Variables }>();
app.use("*", async (ctx, next) => {
  const ai = new AiServices(ctx.env);
  const fin = new FinancialServices(ctx.env);
  const data = new DataServices(ctx.env, fin, ctx.env.KV_DATA);

  const refresher = new RefresherService(
    data,
    fin,
    ctx.env.BULK_SAVE_QUEUE,
    ctx.env.KV_DATA
  );

  ctx.set("financials", fin);
  ctx.set("data", data);
  ctx.set("refresher", refresher);
  ctx.set("ai", ai);
  await next();
});
app.options("api/*", (c) => c.text(""));
//app.get("api/:ticker/price", FinService.getPriceAsync);
app.get("api/:ticker/earnings/next", Http.earnings.getNextDateAsync);
app.get("api/company/:ticker/profile", Http.company.getProfileAsync);
app.get("api/company/:ticker/summary/:date", Http.tradingDaySummary.getAsync);
app.post("api/summarize", Http.summarize.startAsync);
app.get("api/summarize/:instanceId", Http.summarize.checkAsync);
app.get("api/summarize/:instanceId/audio", Http.summarize.getAudioAsync);

app.post("api/ai/summary", async (ctx) =>
  ctx.json(await ctx.var.ai.perplexity.getSummary((await ctx.req.json()).url))
);

app.get("api/test", async (ctx) => {
  await ctx.var.refresher.startAsync();

  return ctx.json({ success: true });
});
app.get("*", (ctx) => ctx.text("Hello World"));

export const APP_ROUTES = app;
