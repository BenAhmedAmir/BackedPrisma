import  Hapi from '@hapi/hapi'
import Joi, { object } from '@hapi/joi'

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
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string()
        .email()
        .required(),
    social: Joi.object({
        facebook: Joi.string().optional(),
        twitter: Joi.string().optional(),
        github: Joi.string().optional(),
        website: Joi.string().optional(),
    }).optional(),
})
async function createUserHandler(req:Hapi.Request, h:Hapi.ResponseToolkit) {
    const {prisma} = req.server.app
    const payload = req.payload as UserInput
    try{
        const createdUser = await prisma.user.create({
            data:{
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                social: JSON.stringify(payload.social)
            },
            select:{
                id:true
            }
        })
        return h.response(createdUser).code(201)


    } catch(err){
        console.log(err)
    }
}

// plugin to instantiate Prisma Client
const usersPlugin = {
    name: 'app/users',
    dependencies: ['prisma'],
    register: async function(server: Hapi.Server) {
        server.route([{
           method: 'POST',
           path: '/users',
           handler: createUserHandler,
           options: {
               validate: {
                   // @ts-ignore
                   payload:userInputValidator,
                   failAction: (request, h, err) => {
                       // show validation errors to user https://github.com/hapijs/hapi/issues/3706
                       throw err
                   },
               },
           },

       }])
    },
}
export default usersPlugin