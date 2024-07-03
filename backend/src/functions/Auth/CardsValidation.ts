import { app } from "@azure/functions";
import { AuthCardValidateRoute } from "../../Routes/Auth/Cards/validate";

app.http('auth-card-validate', {
    route: "auth/cards/validate",
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: AuthCardValidateRoute
});

