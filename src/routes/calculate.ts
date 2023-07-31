import { FastifyInstance } from "fastify";
import prisma from "../utils/prisma";
import axios, { AxiosResponse } from "axios";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const vehicleCapacity = 500;
const vehicleQtd = 2;
const origemFixaInicial =
  "R. Arnaldo Domingos Mota, 265 - Eldorado, São José dos Campos - SP, 12238-572";

interface AddressAndWeight {
  address: string;
  totalWeight: number;
}

interface VehicleWithAddresses {
  name: string;
  addresses: string[];
}

interface Vehicle {
  name: string;
  capacity: number;
}

interface GoogleMapsResponse {
  status: string;
  origin_addresses: string[];
  destination_addresses: string[];
  rows: {
    elements: {
      status: string;
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
    }[];
  }[];
}

async function getDistanceBetweenAddresses(
  origin: string,
  destination: string
): Promise<number> {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(
        origin
      )}&destinations=${encodeURIComponent(
        destination
      )}&key=${googleMapsApiKey}`
    );

    const distanceText = response.data?.rows[0]?.elements[0]?.distance?.text;
    if (distanceText) {
      // O texto da distância é retornado em formato como "9.8 km" ou "12.5 mi", por exemplo.
      // Aqui, estamos extraindo o valor numérico da distância.
      const distanceInKm = parseFloat(distanceText.split(" ")[0]);
      return distanceInKm;
    } else {
      throw new Error("Não foi possível obter a distância entre os endereços.");
    }
  } catch (error) {
    throw new Error("Erro ao consultar a API do Google Maps: ");
  }
}

async function distanceToLastAddress(addresses: string[]): Promise<number> {
  if (addresses.length < 2) {
    return 0;
  }

  const lastAddress = addresses[addresses.length - 1];
  const previousAddress = addresses[addresses.length - 2];

  try {
    const distance = await getDistanceBetweenAddresses(
      previousAddress,
      lastAddress
    );
    return distance;
  } catch (error) {
    // Tratar erros de chamada à API aqui, se necessário.
    console.error("Erro ao calcular a distância:", error);
    return 0; // Retornar um valor padrão em caso de falha na chamada à API.
  }
}

async function optimizeRoutes(
  addressesAndCargo: AddressAndWeight[],
  vehicles: Vehicle[]
): Promise<VehicleWithAddresses[]> {
  const sortedAddresses = addressesAndCargo;
  const vehiclesWithRoutes: VehicleWithAddresses[] = [];

  const assignedAddresses = new Set<string>();

  for (const vehicle of vehicles) {
    const currentVehicleRoutes: string[] = [];
    let currentCargoAmount = 0;

    for (const address of sortedAddresses) {
      if (
        !assignedAddresses.has(address.address) &&
        currentCargoAmount + address.totalWeight <= vehicle.capacity
      ) {
        assignedAddresses.add(address.address);
        currentCargoAmount += address.totalWeight;
        currentVehicleRoutes.push(address.address);
      }

      if (currentVehicleRoutes.length > 0) {
        const distance = await distanceToLastAddress(currentVehicleRoutes);
        if (distance > 35000) {
          assignedAddresses.delete(currentVehicleRoutes.pop()!); // Remove o endereço da rota e do conjunto de endereços atribuídos
          currentCargoAmount -= address.totalWeight;
          break;
        }
      }
    }

    if (currentVehicleRoutes.length > 0) {
      vehiclesWithRoutes.push({
        name: vehicle.name,
        addresses: currentVehicleRoutes,
      });
    }
  }

  return vehiclesWithRoutes;
}

async function getSortedAddresses(
  addresses: AddressAndWeight[]
): Promise<AddressAndWeight[]> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?key=${apiKey}`;
    const origins = origemFixaInicial;
    const destinations = addresses
      .map((endereco: AddressAndWeight) => encodeURIComponent(endereco.address))
      .join("|");

    const response = await axios.get(
      `${apiUrl}&origins=${origemFixaInicial}&destinations=${destinations}`
    );

    const elements = response.data.rows[0].elements;
    const distancesWithAddresses = elements.map(
      (element: any, index: number) => {
        if (
          element.status === "OK" &&
          element.distance &&
          element.distance.value
        ) {
          return {
            address: addresses[index],
            distance: element.distance.value,
          };
        }
        return {
          address: addresses[index],
          distance: Infinity,
        };
      }
    );

    const sortedAddresses = distancesWithAddresses
      .sort((a: any, b: any) => a.distance - b.distance)
      .map((item: AddressAndWeight) => item.address);

    return sortedAddresses;
  } catch (error) {
    console.log(error);
    throw new Error("Error fetching distance data from Google Maps API");
  }
}

export async function calculateRoutes(app: FastifyInstance) {
  app.get("/routes", async (req, rep) => {
    const veiculos: Vehicle[] = [
      { name: "Veiculo 1", capacity: 600 },
      { name: "Veiculo 2", capacity: 800 },
    ];

    const diaParam = new Date().toISOString();

    // Verifica se o parâmetro 'dia' está no formato de data ISO (YYYY-MM-DD)
    if (!/\d{4}-\d{2}-\d{2}/.test(diaParam)) {
      return { error: "Formato de data inválido. Use o formato YYYY-MM-DD." };
    }

    const sales = await prisma.sale.findMany({
      // where: {
      //   createdAt: diaParam,
      // },
      include: {
        customer: true,
      },
    });

    const addresses: AddressAndWeight[] = sales.map((sale) => ({
      address: sale.customer?.address + " - " + sale.customer?.city,
      totalWeight: sale.totalWeight,
    }));

    try {
      const enderecosClientes: string[] = addresses.map(
        (address) => address.address
      );

      const waypoints = [...addresses];

      const sortedAddresses = getSortedAddresses(waypoints);

      const delivery = optimizeRoutes(await sortedAddresses, veiculos)
        .then((optimizedRoutes) => {
          rep.send(optimizedRoutes);
        })
        .catch((error) => {
          console.error("Erro ao otimizar rotas:", error);
        });

      const result = await delivery;
    } catch (error) {
      console.error(error);
      rep.status(500).send("Internal Server Error");
    }
  });
}
