import Fastify from "fastify";
import 'dotenv/config'
import cors from '@fastify/cors'
import { customersRoutes } from './routes/customers'

const server = Fastify();

server.register(cors, { 
  origin: true,
})

server.register(customersRoutes)

server.get("/health", async function (req, res) {
  return { status: "OK" };
});

server.listen({
    port: 3000,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log('🚀 HTTP server running on http://localhost:3000')
  })
