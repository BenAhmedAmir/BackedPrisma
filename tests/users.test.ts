import Hapi from "@hapi/hapi";
import {createServer} from "../src/server";

describe('POST /users - create user', function () {
    let server: Hapi.Server
    beforeAll(async () => {
        server = await createServer()
    })
    afterAll(async () => {
        await server.stop()
    })
    let userId;
    test('create user', async () => {
        const response = await server.inject({
            method: 'POST',
            url:'/users',
            payload: {
                firstName: 'test-first-name',
                lastName: 'test-last-name',
                email: `test-${Date.now()}@benahmed.tn`,
                social:{
                    twitter : 'BENAHMED',
                    website : 'http://benahmed.com'
                }
            }
        })
        expect(response.statusCode).toEqual(201)
        userId = JSON.parse(response.payload)?.id
        expect(typeof userId === 'number').toBeTruthy()
    })
   test('create user validation', async () => {
       const response = await server.inject({
           method: 'POST',
           url: '/users',
           payload: {
               firstName: 'firstname',
               email: `test-${Date.now()}@benahmed.tn`,
               social: {
                   twitter: 'blablablablablablablablablabl',
                   website: 'http://blablablablablablablabl.com'
               }
           }
           })
           console.log(response.payload )
             expect(response.statusCode).toEqual(400)
           
       })
});