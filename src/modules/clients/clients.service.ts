import prisma from "../../utils/prisma";
import { CreateClientInput } from "./clients.schema";

export async function createClient(input: CreateClientInput) {
  const user = await prisma.customer.create({
    data: input,
  });
}
