import jwt from 'jsonwebtoken'
import { HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";

export const Authenticate = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit | { status: true, user: AuthToken }> => {
    const authHeader = await request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return {
        status: 401,
        body: 'Unauthorized'
    }

    // Idiot solutions type any
    const verify: any = jwt.verify(token, process.env.API_JWT_TOKEN, async(err: any, user?: AuthToken) => {
        if (err) return {
            status: 404,
            body: err
        }; 
        

        return {
            status: true,
            user
        };
    })
    
    return verify;
}
