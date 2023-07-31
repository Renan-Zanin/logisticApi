import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../utils/prisma";
import ExcelJS from "exceljs";
import { CreateClientInput } from "../modules/clients/clients.schema";

export async function salesRoutes(app: FastifyInstance) {
  app.get("/sales", async (request) => {
    const sales = await prisma.sale.findMany();
    return sales;
  });

  app.get("/sales/:id", async (request, reply) => {
    const saleIdSchema = z.object({
      id: z.string(),
    });

    const { id } = saleIdSchema.parse(request.params);

    const sale = prisma.sale.findUnique({
      where: {
        id,
      },
    });

    return sale;
  });

  app.post("/sales", async (request, reply) => {
    const saleSchema = z.object({
      client: z.string(),
  saleId: z.string(),
  customerId: z.string(),
  totalWeight: z.number(),
  seller: z.string()
    });

    const {
        client,
        saleId,
        customerId,
        totalWeight,
        seller
    } = saleSchema.parse(request.body);

    const customer = await prisma.customer.findFirstOrThrow({
      where: {
        id: customerId
      }
    })

    const sale = await prisma.sale.create({
      data: {
        client,
        saleId,
        customerId,
        totalWeight,
        seller
      },
    });

    return sale;
  });

  app.put("/sales/:id", async (request, reply) => {
    const saleIdSchema = z.object({
      id: z.string(),
    });

    const saleSchema = z.object({
      customerId: z.string(),
      totalWeight: z.number(),
      seller: z.string()
    });

    const { id } = saleIdSchema.parse(request.params);

    const {
      customerId,
      totalWeight,
      seller
    } = saleSchema.parse(request.body);

    let sale = await prisma.sale.findFirstOrThrow({
      where: {
        id,
      },
    });

    const customer = await prisma.customer.findFirstOrThrow({
      where: {
        id: customerId
      }
    })

    if(!customer) {
      return reply.status(401).send('Customer not exits!')
    }

    if (!sale) {
      return reply.status(401).send("The sale ID not exists!");
    }

    sale = await prisma.sale.update({
      where: {
        id,
      },
      data: {
        customerId,
        totalWeight,
        seller
      },
    });

    return sale;
  });

  app.delete("/sales/:id", async (request, reply) => {
    const saleIdSchema = z.object({
      id: z.string(),
    });

    const { id } = saleIdSchema.parse(request.params);

    const sale = await prisma.sale.findUnique({
      where: {
        id,
      },
    });

    if (!sale) {
      return reply.status(401).send("sale ID not exists!");
    }

    await prisma.sale.delete({
      where: {
        id,
      },
    });

    return reply.status(200).send("Sale exclude with success!");
  });
}
