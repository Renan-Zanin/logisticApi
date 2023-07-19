import { FastifyInstance } from "fastify";
import { registerClientHandler } from "./clients.controller";
import xlsx from "xlsx";
import prisma from "../../utils/prisma";
import { createClient } from "./clients.service";

async function clientRoutes(server: FastifyInstance) {
  server.post("/", registerClientHandler);
}

export default clientRoutes;
