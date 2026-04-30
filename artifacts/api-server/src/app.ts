import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http"; // CORREÇÃO 1: Adicionado as chaves { }
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      // CORREÇÃO 2: Adicionado ": any" para o parâmetro req
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      // CORREÇÃO 3: Adicionado ": any" para o parâmetro res
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
