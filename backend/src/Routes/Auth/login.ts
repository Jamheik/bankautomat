import Person, { PersonLogin } from '../../Models/DataModels/Person';

import { getPoolConnection } from '../../Handler/Database'
import { PasswordManager } from '../../Controllers/PasswordManager'
import { VarChar } from 'mssql'

import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { LoginController } from '../../Controllers/LoginController';

export const AuthLoginRoute = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
        const user: PersonLogin = JSON.parse(await request.text());

        const passwordHash = await getPersonPasswordHashByEmail(user);
        if (!passwordHash) {
            return {
                status: 400,
                body: "Invalid password",
            }
        }

        const passManager = new PasswordManager(user.Password);
        const isPassCompare = await passManager.comparePasswordHash(passwordHash);

        if (!isPassCompare) {
            return {
                status: 400,
                body: "Invalid password",
            }
        }

        const personId = await getPersonIdEmail(user);
        if (!personId) {
            return {
                status: 400,
                body: "Invalid params",
            }
        }

        const tokenManager = new LoginController(personId);
        const token = await tokenManager.getToken();

        console.log("New login with data", {
            user: personId,
            email: user.Email
        });

        return {
            status: 200,
            jsonBody: {
                success: true,
                message: "Login success",
                data: token,
            }
        }
    } catch (err: any) {
        console.error(err)
        return {
            status: 400,
            body: err.message.toString(),
        };
    }
};

const getPersonPasswordHashByEmail = async ({ Email }: PersonLogin | Person): Promise<string | undefined> => {
    const poolConnection = await getPoolConnection();

    const result = await poolConnection
        .input('email', VarChar, Email)
        .query(`SELECT Password FROM Users WHERE Email = @email`);
    return result['recordset']?.[0]?.Password ?? undefined;
}

const getPersonIdEmail = async ({ Email }: PersonLogin | Person): Promise<number | undefined> => {
    const poolConnection = await getPoolConnection();

    const result = await poolConnection
        .input('email', VarChar, Email)
        .query(`SELECT UserID FROM Users WHERE Email = @email`);
    return result['recordset']?.[0]?.UserID ?? undefined;
}