import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Authenticate } from "../../Routes/Middlewares/Auth";

async function AuthTest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {    
    const auth = await Authenticate(request, context);
    if (auth?.status !== true) return auth;

    context.log('Http function was triggered.');
    return { body: 'Hello, world!' };
};

app.http('auth-test', {
    route: "auth/test",
    methods: ['GET','POST'],
    authLevel: 'admin',
    handler: AuthTest
});

