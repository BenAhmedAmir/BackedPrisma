import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";
import { TokenType, UserRole } from '@prisma/client'
import Boom from "@hapi/boom";


const EMAIL_TOKEN_EXPIRATION_MINUTES = 10
interface LoginInput {
    email: string
}
// Load the JWT secret from environment variables or default
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_JWT_SECRET'

const JWT_ALGORITHM = 'HS256'

const AUTHENTICATION_TOKEN_EXPIRATION_HOURS = 12

interface AuthenticateInput {
    email: string
    emailToken: string
}
async function loginHandler(request:Hapi.Request,h:Hapi.ResponseToolkit){
    // 👇 get prisma and the sendEmailToken from shared application state
    const {prisma, sendEmailToken} = request.server.app
    // 👇 get the email from the request payload
    const {email} = request.payload as LoginInput
    // 👇 generate an alphanumeric token
    const emailToken = generateEmailToken()
    // 👇 create a date object for the email token expiration
    const tokenExpiration = add(new Date(), {
        minutes:EMAIL_TOKEN_EXPIRATION_MINUTES
    })
    try{
        // 👇 create a short lived token and update user or create if they don't exist
    const createdToken = await prisma.token.create({
        data:{
            emailToken,
            type:TokenType.EMAIL,
            expiration:tokenExpiration,
            user:{
                connectOrCreate:{
                    create:{
                        email,
                    },
                    where:{
                        email
                    }
                }
            }
        }
    })
        // 👇 send the email token
    await sendEmailToken(email,emailToken)
        return h.response().code(200)
    } catch (e) {
        return  Boom.badImplementation(e.message)
    }
}

async function authenticateHandler(request:Hapi.Request,h:Hapi.ResponseToolkit){
    // 👇 get prisma from shared application state
    const { prisma } = request.server.app
    // 👇 get the email and emailToken from the request payload
    const { email, emailToken } = request.payload as AuthenticateInput
    try{
        // Get short lived email token
        const fetchedEmailToken = await prisma.token.findUnique({
            where:{
                emailToken:emailToken,
            },
            include :{
                user:true,
            }
        })
        if(!fetchedEmailToken?.valid){
            // If the token doesn't exist or is not valid, return 401 unauthorized
            return Boom.unauthorized()
        }
        if (fetchedEmailToken.expiration < new Date()) {
            // If the token has expired, return 401 unauthorized
            return Boom.unauthorized('Token expired')
        }
        // If token matches the user email passed in the payload, generate long lived API token
        if(fetchedEmailToken?.user?.email ===email) {
            const tokenExpiration = add(new Date()), {
                hours: AUTHENTICATION_TOKEN_EXPIRATION_HOURS,
            }
        }
    }
}
const authPlugin: Hapi.Plugin<null> = {
    name:'app/auth',
    dependencies:['prisma', 'hapi-auth-jwt2', 'app/email'],
    register:async function(server:Hapi.Server){
        server.route([{
            method:'POST',
            path:'/login',
            handler:loginHandler,
            options:{
                auth:false,
                validate:{
                    // @ts-ignore
                    payload:Joi.object({
                        email:Joi.string()
                            .email().required()
                    })
                }
            }
        },{
            method:'POST',
            path:'/authenticate',
            handler:authenticateHandler,
            options:{
                auth:false,
                validate: {
                    payload: Joi.object({
                        email:Joi.string()
                            .email()
                            .required(),
                        emailToken:Joi.string().required()
                    })
                }
            }
        }])
    }
}
//👇  Generate a random 8 digit number as the email token
function generateEmailToken(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString()
}
export default authPlugin