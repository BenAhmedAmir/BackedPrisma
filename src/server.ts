import Hapi from '@hapi/hapi'
import statusPlugin from './plugins/status'
import prismaPlugin from "./plugins/prisma";
import usersPlugin from "./plugins/users";
import emailPlugin from "./plugins/email";
import authPlugin from "./plugins/auth";
import hapiAuthJwt2 from "hapi-auth-jwt2";
const server: Hapi.Server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
})

export async function createServer(): Promise<Hapi.Server> {
    await server.register([statusPlugin, prismaPlugin, usersPlugin,
    emailPlugin, authPlugin, hapiAuthJwt2])
    await server.initialize()
    return server
}
export async function startServer(server:Hapi.Server): Promise<Hapi.Server> {
    await server.start()
    console.log(`server started on ${server.info.uri}`)
    return server
}
process.on('unhandledRejection', err => {
    console.log(err)
    process.exit(1)
})
