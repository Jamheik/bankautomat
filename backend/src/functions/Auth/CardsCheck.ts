import { app } from "@azure/functions";
import { AuthCardCheckRoute } from "../../Routes/Auth/Cards/check";

app.http('auth-card-check', {
    route: "auth/cards",
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: AuthCardCheckRoute
});

