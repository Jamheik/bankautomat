import sql from 'mssql'
import Person from '../../Models/DataModels/Person';
import { getPoolConnection } from '../../Handler/Database'
import { HttpRequest, HttpResponseInit } from "@azure/functions";
import { CreateNewUser } from '../../Controllers/CreateNewPerson';

export const AuthRegisterRoute = async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
        const person: Person = JSON.parse(await request.text());
        const authResult = await CreateNewUser(person);

        return {
            status: 201,
            jsonBody: authResult
        };
    } catch (error: any) {
        console.error(error);

        return {
            status: 400,
            body: error.message.toString(),
        };
    }
};

const getPersonEmailAmount = async ({ Email }: Person): Promise<number> => {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('email', sql.VarChar, Email)
        .query(`SELECT COUNT(email) as amount FROM person WHERE email = @email`);

    return result['recordset']?.[0]?.amount ?? 0;
}