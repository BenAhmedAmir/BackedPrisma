import Hapi from '@hapi/hapi'
import Joi, {object} from '@hapi/joi'
import Boom from "@hapi/boom";

interface UserInput {
    firstName: string
    lastName: string
    email: string
    social: {
        facebook?: string
        twitter?: string
        github?: string
        website?: string
    }
}

const userInputValidator = Joi.object({
    firstName: Joi.string().alter({
        create: schema => schema.required(),
        update: schema => schema.optional(),
    }),
    lastName: Joi.string().alter({
        create: schema => schema.required(),
        update: schema => schema.optional(),
    }),
    email: Joi.string()
        .email()
        .alter({
            create: schema => schema.required(),
            update: schema => schema.optional(),
        }),
    social: Joi.object({
        facebook: Joi.string().optional(),
        twitter: Joi.string().optional(),
        github: Joi.string().optional(),
        website: Joi.string().optional(),
    }).optional(),
})

const createUserValidator = userInputValidator.tailor('create')
const updateUserValidator = userInputValidator.tailor('update')

async function createUserHandler(req: Hapi.Request, h: Hapi.ResponseToolkit) {
    const {prisma} = req.server.app
    const payload = req.payload as UserInput
    try {
        const createdUser = await prisma.user.create({
            data: {
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                social: JSON.stringify(payload.social)
            },
            select: {
                id: true
            }
        })
        return h.response(createdUser).code(201)


    } catch (err) {
        console.log(err)
    }
}

async function getUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const {prisma} = request.server.app
    const userId = parseInt(request.params.userId, 10)

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        })
        if (!user) {
            return h.response().code(404)
        } else {
            return h.response(user).code(200)
        }
    } catch (err) {
        console.log(err)
        return Boom.badImplementation()
    }
}

async function deleteUser(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const {prisma} = request.server.app
    const userId = parseInt(request.params.userId, 10)

    try {
        const user = await prisma.user.delete({
            where: {
                id: userId,
            },
        })
        return h.response().code(204)
    } catch (err) {
        console.log(err)
        return h.response().code(500)
    }
}
async function updateUserHandler(
    request: Hapi.Request,
    h: Hapi.ResponseToolkit,
) {
    const { prisma } = request.server.app
    const userId = parseInt(request.params.userId, 10)
    const payload = request.payload as Partial<UserInput>

    try {
        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data: payload,
        })
        return h.response(updatedUser).code(200)
    } catch (err) {
        request.log('error', err)
        // @ts-ignore
        return Boom.badImplementation('failed to update user')
    }
}
// plugin to instantiate Prisma Client
const usersPlugin = {
    name: 'app/users',
    dependencies: ['prisma'],
    register: async function (server: Hapi.Server) {
        // @ts-ignore
        server.route([{
            method: 'POST',
            path: '/users',
            handler: createUserHandler,
            options: {
                validate: {
                    // @ts-ignore
                    payload: createUserValidator,
                    failAction: (request, h, err) => {
                        // show validation errors to user https://github.com/hapijs/hapi/issues/3706
                        throw err
                    },
                },
            },

        }, {
            method: 'GET',
            path: '/users/{userId}',
            handler: getUserHandler,
            options: {
                validate: {
                    // @ts-ignore
                    params: Joi.object({
                        userId: Joi.number().integer(),
                    }),
                },
            },
        }, {
                method: 'DELETE',
                path: '/users/{userId}',
                handler: deleteUser,
                options: {
                    validate: {
                        // @ts-ignore
                        params: Joi.object({
                            userId: Joi.number().integer()
                        }),
                    }
                }
            },
            {
                method: 'PUT',
                path: '/users/{userId}',
                handler: updateUserHandler,
                options: {
                    validate: {
                        // @ts-ignore
                        params: Joi.object({
                            userId: Joi.number().integer(),
                        }),
                        // @ts-ignore
                        payload: updateUserValidator,
                        failAction: (request, h, err) => {
                            // show validation errors to user https://github.com/hapijs/hapi/issues/3706
                            throw err
                        },
                    },
                },
            }
        ])
    },
}
export default usersPlugin