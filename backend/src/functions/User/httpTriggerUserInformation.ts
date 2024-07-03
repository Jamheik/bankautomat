import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Authenticate } from "../../Routes/Middlewares/Auth";
import { PersonModel } from "../../Models/PersonModel";

async function UserInformation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const auth = await Authenticate(request, context);
        if (auth?.status !== true) return auth;

        const { user }: { status: true, user: AuthToken } = auth;

        const person = new PersonModel(user._id);
        await person.getPersonData();

        return { status: 200, jsonBody: { lastname: person.personData.LastName, firstname: person.personData.FirstName, email: person.personData.Email } };
    } catch (err: any) {
        return { status: 500, body: JSON.stringify({ error: err.message }) };
    }
};

app.http('user-information', {
    route: "user",
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: UserInformation
});

