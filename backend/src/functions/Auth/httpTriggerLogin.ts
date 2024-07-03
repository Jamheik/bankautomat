import { app } from "@azure/functions";
import { AuthLoginRoute } from "../../Routes/Auth/login";

app.http('auth-login', {
    route: "auth/login",
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: AuthLoginRoute
});

