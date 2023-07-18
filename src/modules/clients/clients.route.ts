import { FastifyInstance } from "fastify";
import { registerClientHandler } from "./clients.controller";
import xlsx from "xlsx";
import prisma from "../../utils/prisma";
import { createClient } from "./clients.service";

async function clientRoutes(server: FastifyInstance) {
  server.post("/", registerClientHandler);

  server.get("/", async (req, rep) => {
    try {
      const workbook = xlsx.readFile("./clients.xlsx");

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      for (const row of worksheet.getRows()) {
        createClient({
          clientCod: row[1],
          client: row[2],
          name: row[3],
          register: row[12],
          phone: row[10],
          ddd: row[9],
          email: row[25],
          zipCode: row[26],
          address: row[6],
          city: row[7],
          neighborhood: row[16],
          type: row[0],
        });
      }
      rep.send("Success!");
    } catch (err) {
      rep.send({ success: false, message: "Erro ao importar os dados." });
    }
  });
}

export default clientRoutes;
