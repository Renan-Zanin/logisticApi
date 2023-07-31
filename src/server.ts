import Fastify from "fastify";
import "dotenv/config";
import { importSales, importsRoutes } from "./routes/import";
import { calculateRoutes } from "./routes/calculate";
import "dotenv/config";
import cors from "@fastify/cors";
import { customersRoutes } from "./routes/customers";
import { salesRoutes } from "./routes/sales";

const server = Fastify();

server.register(cors, {
  origin: true,
});

server.register(customersRoutes);
server.register(importsRoutes);
server.register(calculateRoutes);
server.register(salesRoutes);
server.register(importSales);

server.get("/health", async function (req, res) {
  return { status: "OK" };
});

server
  .listen({
    port: 3000,
    host: "0.0.0.0",
  })
  .then(() => {
    console.log("🚀 HTTP server running on http://localhost:3000");
  });
