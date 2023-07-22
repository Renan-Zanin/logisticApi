import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../utils/prisma";
import ExcelJS from "exceljs";
import { CreateClientInput } from "../modules/clients/clients.schema";

async function extractDataFromExcel(
  filePath: string
): Promise<CreateClientInput[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  const customerData: CreateClientInput[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber !== 1) {
      const clientCod = row.getCell(2).toString();
      const client = row.getCell(3).toString();
      const name = row.getCell(4).toString();
      const register = row.getCell(13).toString();
      const phone = row.getCell(11).toString();
      const ddd = row.getCell(10).toString();
      const email = row.getCell(26).toString();
      const zipCode = row.getCell(27).toString();
      const address = row.getCell(7).toString();
      const city = row.getCell(8).toString();
      const neighborhood = row.getCell(17).toString();
      const type = row.getCell(1).toString();

      customerData.push({
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
      });
    }
  });

  return customerData;
}

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

  app.post("/customers", async (request, reply) => {
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
      type: z.literal('VAREJO').or(z.literal('MERCADO'))
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

    const customerExists = await prisma.customer.findUnique({
      where: {
        register
      }
    })

    if(customerExists) {
      return reply.status(401).send("Customer already exists!")
    }
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
    const customerParamsSchema = z.object({
      id: z.string(),
    });

    const { id } = customerParamsSchema.parse(request.params);

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
      type: z.literal('VAREJO').or(z.literal('MERCADO'))
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

    return reply.status(200).send("Customer exclude with success!");
  });
}
