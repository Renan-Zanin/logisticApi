import { FastifyInstance } from "fastify";
import prisma from "../utils/prisma";
import axios from "axios";
import { Customer } from "@prisma/client";

async function getGoogleMapsRoute(start: string, end: string): Promise<number> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start}&destination=${end}&key=${apiKey}`;
  const response = await axios.get(url);
  return response.data.routes[0].legs[0].distance.value; // Retorna a distância em metros
}

async function getCustomerRoutes(ids: string[]): Promise<any> {
  const customers = await prisma.customer.findMany({
    where: {
      id: { in: ids },
    },
  });

  function calculateDistance(start: string, end: string): Promise<number> {
    return getGoogleMapsRoute(start, end);
  }

  const combinations = getCombinations(customers, 3);

  let minDistance = Number.MAX_VALUE;
  let bestRoute: any = null;

  for (const combination of combinations) {
    const addresses = combination.map((customer) => customer.address);
    const startAddress = addresses[0];
    const endAddress = addresses[addresses.length - 1];

    const distances = await Promise.all(
      combination.map((customer, index) => {
        if (index < combination.length - 1) {
          return calculateDistance(
            customer.address,
            combination[index + 1].address
          );
        }
        return 0;
      })
    );

    const totalDistance = distances.reduce((acc, curr) => acc + curr, 0);

    if (totalDistance < minDistance) {
      minDistance = totalDistance;
      bestRoute = combination;
    }
  }

  return bestRoute;
}

function getCombinations<T>(arr: T[], size: number): T[][] {
  const results: T[][] = [];
  function helper(arr: T[], chosen: T[], start: number): void {
    if (chosen.length === size) {
      results.push([...chosen]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]);
      helper(arr, chosen, i + 1);
      chosen.pop();
    }
  }
  helper(arr, [], 0);
  return results;
}

export async function calculateRoutes(app: FastifyInstance) {
  app.get("/routes", async (req, rep) => {
    try {
      const customers = await prisma.customer.findMany();
      const customerIds = customers.map((customer) => customer.id);
      const bestRoute = await getCustomerRoutes(customerIds);
      rep.send(bestRoute);
    } catch (error) {
      console.error(error);
      rep.status(500).send("Internal Server Error");
    }
  });
}
