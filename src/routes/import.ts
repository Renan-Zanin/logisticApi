import { FastifyInstance } from "fastify";
import prisma from "../utils/prisma";
import ExcelJS from "exceljs";
import { CreateClientInput } from "../modules/clients/clients.schema";
import { CreateSaleInput } from "../modules/sales/sales.schema";

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
      // const type = row.getCell(1).toString();

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
        // type,
      });
    }
  });

  return customerData;
}

async function checkDataExists(
  customerData: CreateClientInput[]
): Promise<CreateClientInput[]> {
  const existingCod = await prisma.customer.findMany({
    where: {
      clientCod: {
        in: customerData.map((customer) => customer.clientCod),
      },
    },
    select: {
      clientCod: true,
    },
  });

  const uniqueCustomerData = customerData.filter(
    (customer) =>
      !existingCod.find(
        (existingCustomer) => existingCustomer.clientCod === customer.clientCod
      )
  );

  return uniqueCustomerData;
}

async function findUserIdByName(name: string): Promise<string | null> {
  try {
    // Faça a busca no banco de dados
    const user = await prisma.customer.findFirst({
      where: {
        client: name,
      },
      select:{
        id: true
      }
    });

    // Se o usuário for encontrado, retorne o ID, caso contrário, retorne null
    return user ? user.id : null;
  } catch (error) {
    console.error('Erro ao buscar o ID do usuário:', error);
    throw error;
  }
}

async function extractSalesFromExcel(
  filePath: string
): Promise<CreateSaleInput[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  const customerData: CreateSaleInput[] = [];

  try {
    worksheet.eachRow(async(row, rowNumber) => {
      if (rowNumber !== 1) {
        const client = row.getCell(9).toString();
        const saleId = row.getCell(6).toString();
        const weight = row.getCell(13);
        const totalWeight= Number(weight);
        const seller = row.getCell(15).toString();

        const customerCod  = await findUserIdByName(client)

        console.log(customerCod)
    if (customerCod !== null) {
      customerData.push({
        client,
        saleId,
        totalWeight,
        seller,
        customerId: customerCod
      });  
    } else {
      console.log(`Nenhum cliente encontrado`);
    }
  
           
      }
    });
  
    
  } catch (error) {
    // Trate o erro conforme sua necessidade
    console.error('Erro:', error);
  } 

  return customerData;


 
}

export async function importsRoutes(app: FastifyInstance) {
  app.post("/import", async (req, rep) => {
    try {
      const filePath =
        "E:/portifolio/PROJETOS/logisticsApi/src/routes/clients.xlsx";

      const customerData = await extractDataFromExcel(filePath);

      const uniqueCustomerData = await checkDataExists(customerData);

      if (uniqueCustomerData.length === 0) {
        return rep.send({
          success: false,
          message: "Todos os dados já existem no banco de dados.",
        });
      }

      const createCustomers = await prisma.customer.createMany({
        data: uniqueCustomerData,
      });

      rep.send({ success: true, message: "Dados importados com sucesso." });
    } catch (error) {
      console.error(error);
      rep.send({ success: false, message: "Erro ao importar os dados." });
    }
  });
}


export async function importSales(app: FastifyInstance) {
  app.post("/importSales", async (req, rep) => {
    try {
      const filePath =
        "E:/portifolio/PROJETOS/logisticsApi/src/routes/sales.xlsx";

      const salesData = await extractSalesFromExcel(filePath);     

      const createSales = await prisma.sale.createMany({
        data: salesData,
      });

      rep.send({ success: true, message: "Dados importados com sucesso." });
    } catch (error) {
      console.error(error);
      rep.send({ success: false, message: "Erro ao importar os dados." });
    }
  });
}
