import * as z from "zod";

const createClientSchema = z.object({
  clientCod: z.number(),
  client: z.string(),
  name: z.string(),
  register: z.string({ required_error: "CGC/CPF necessário" }),
  phone: z.number(),
  ddd: z.number(),
  email: z.string().email(),
  zipCode: z.string(),
  address: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  type: z.string(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
