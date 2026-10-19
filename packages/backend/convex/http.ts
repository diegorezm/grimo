import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Better Auth endpoints at <CONVEX_SITE_URL>/api/auth/*. CORS for the web app (SITE_URL).
authComponent.registerRoutes(http, createAuth, { cors: true });

export default http;
