import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../utils/prisma";

export async function customersRoutes(app: FastifyInstance) {
  app.get("/customers", async (request) => {
    const customers = await prisma.customer.findMany();
    return customers;
  });

  app.get("/customers/:id", async (request, reply) => {
    const uniqueCustumerSchema = z.object({
      id: z.string(),
    });

    const { id } = uniqueCustumerSchema.parse(request.params);

    const customer = prisma.customer.findUnique({
      where: {
        id,
      },
    });

    return customer;
  });

  app.post("/customers", async (request) => {
    const createCustomerSchema = z.object({
      clientCod: z.string(),
      client: z.string(),
      name: z.string(),
      register: z.string({ required_error: "CGC/CPF necessário" }),
      phone: z.string(),
      ddd: z.string(),
      email: z.string().email(),
      zipCode: z.string(),
      address: z.string(),
      city: z.string(),
      neighborhood: z.string(),
      type: z.string(),
    });

    const {
      clientCod,
      client,
      name,
      register,
      phone,
      ddd,
      email,
      zipCode,
      address,
      city,
      neighborhood,
      type,
    } = createCustomerSchema.parse(request.body);
    const customer = await prisma.customer.create({
      data: {
        clientCod,
        client,
        name,
        register,
        phone,
        ddd,
        email,
        zipCode,
        address,
        city,
        neighborhood,
        type,
      },
    });

    return customer;
  });

  app.put("/customers/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const { id } = paramsSchema.parse(request.params);

    const updateCustomerSchema = z.object({
      clientCod: z.string(),
      client: z.string(),
      name: z.string(),
      register: z.string({ required_error: "CGC/CPF necessário" }),
      phone: z.string(),
      ddd: z.string(),
      email: z.string().email(),
      zipCode: z.string(),
      address: z.string(),
      city: z.string(),
      neighborhood: z.string(),
      type: z.string(),
    });

    const {
      clientCod,
      client,
      name,
      register,
      phone,
      ddd,
      email,
      zipCode,
      address,
      city,
      neighborhood,
      type,
    } = updateCustomerSchema.parse(request.body);

    let customer = await prisma.customer.findFirstOrThrow({
      where: {
        id,
      },
    });

    if (!customer) {
      return reply.status(401).send("The customer ID not exists!");
    }

    customer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        clientCod,
        client,
        name,
        register,
        phone,
        ddd,
        email,
        zipCode,
        address,
        city,
        neighborhood,
        type,
      },
    });

    return customer;
  });

  app.delete("/customers/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const { id } = paramsSchema.parse(request.params);

    const customer = await prisma.customer.findFirstOrThrow({
      where: {
        id,
      },
    });

    if (!customer) {
      return reply.status(401).send("Customer ID not exists!");
    }

    await prisma.customer.delete({
      where: {
        id,
      },
    });

    return reply.status(200).send("User exclude with success!");
  });
}
