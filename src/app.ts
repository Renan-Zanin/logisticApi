import Fastify from "fastify";

import userRoutes from "./modules/clients/clients.route";

const server = Fastify();

server.get("/healthcheck", async function (req, res) {
  return { status: "OK" };
});

async function main() {
  server.register(userRoutes, { prefix: "api/users" });

  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server ready at http://localhost:3000");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
