import { Context as C } from "hono";
import { Variables } from "./variables.model";

export type Context = C<{ Bindings: Env; Variables: Variables }>;
