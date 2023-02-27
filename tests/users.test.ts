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
    let userId: number;
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
    test('get user returns 404 for non existant user', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/users/9999',
        })

        expect(response.statusCode).toEqual(404)
    })
    test('get user returns user', async () => {
        const response = await server.inject({
            method: 'GET',
            url: `/users/${userId}`,
        })
        expect(response.statusCode).toEqual(200)
        const user = JSON.parse(response.payload)

        expect(user.id).toBe(userId)
    })
    test('update user fails with invalid userId parameter', async () => {
        const response = await server.inject({
            method: 'PUT',
            url: `/users/aa22`,
        })
        expect(response.statusCode).toEqual(400)
    })
    test('update user', async () => {
        const updatedFirstName = 'AmirBEN'
        const updatedLastName = 'AmirUPDATED'

        const response = await server.inject({
            method: 'PUT',
            url: `/users/${userId}`,
            payload: {
                firstName: updatedFirstName,
                lastName: updatedLastName,
            },
        })
        expect(response.statusCode).toEqual(200)
        const user = JSON.parse(response.payload)
        expect(user.firstName).toEqual(updatedFirstName)
        expect(user.lastName).toEqual(updatedLastName)
    })

    test('delete user fails with invalid userId parameter', async () => {
        const response = await server.inject({
            method: 'DELETE',
            url: `/users/aa22`,
        })
        expect(response.statusCode).toEqual(400)
    })
    test('delete user', async () => {
        const response = await server.inject({
            method: 'DELETE',
            url: `/users/${userId}`,
        })
        expect(response.statusCode).toEqual(204)
    })
});