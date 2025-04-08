import type { Context as C } from "hono";
import type { Variables } from "./variables.model";

export type Context = C<{ Bindings: CfEnv; Variables: Variables }>;
