import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import authRouter from "@v1/routes/auth.route";
import accountsRouter from "@v1/routes/accounts.route";
import postsRouter from "@v1/routes/posts.route";
import campaignsRouter from "@v1/routes/campaigns.route";
import webhookRouter from "@v1/routes/webhook.route";
import { servePolicyPage } from "@/pages/policy.page";
import { swaggerJson, swaggerSpec } from "@/docs/swagger";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.send("Express server is up and running!");
});
app.get("/policy", servePolicyPage);
app.get("/api/docs/swagger.json", swaggerJson);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/accounts", accountsRouter);
app.use("/api/v1/posts", postsRouter);
app.use("/api/v1/campaigns", campaignsRouter);
app.use("/webhooks", webhookRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
