import { app } from "@azure/functions";
import { AuthRegisterRoute } from "../../Routes/Auth/register";

app.http('auth-register', {
    route: "auth/register",
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: AuthRegisterRoute
});

