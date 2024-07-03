import sql, { VarChar } from 'mssql'
import { getPoolConnection } from '../../../Handler/Database'
import { HttpRequest, HttpResponseInit } from "@azure/functions";
import { PasswordManager } from '../../../Controllers/PasswordManager';
import { LoginController } from '../../../Controllers/LoginController';
import { getCardFailedLoginAmountById } from './check';

export const AuthCardValidateRoute = async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
        const id = request.query.get('id');
        const pass = request.query.get('pass');
        if (!id || !pass) {
            throw new Error('Invalid params, make sure you send correct params!');
        }

        const passwordHash = await getCardCodeById(id);
        if (!passwordHash) {
            throw new Error("Invalid card id!");
        }

        const passManager = new PasswordManager(pass);
        const isMatch = await await passManager.comparePasswordHash(passwordHash);

        if (!isMatch) {
            const loginTryCount = await getCardFailedLoginAmountById(id);
            if (loginTryCount >= 3) {
                throw new Error('account locked');
            }

            await CreateFailedLogin(id);

            throw new Error("Invalid pincode");
        }

        const userId = await getCardCustomerById(id);
        if (!userId) {
            throw new Error("Invalid to fetch customerId");
        }

        const tokenController = new LoginController(userId, id);
        const token = await tokenController.getToken();

        return {
            status: 201,
            jsonBody: token
        };
    } catch (error: any) {
        console.error(error);

        return {
            status: 400,
            body: error.message.toString(),
        };
    }
};

const getCardCustomerById = async (cardID: string): Promise<number> => {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('cardID', sql.VarChar, cardID)
        .query(`SELECT c.UserID FROM PhysicalCards pc
                INNER JOIN Customers c ON c.CustomerID = pc.CustomerID
            WHERE pc.PhysicalCardID =  @cardID`);

    return result['recordset']?.[0]?.UserID ?? null;
}

const getCardCodeById = async (cardID: string): Promise<string> => {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('cardID', sql.VarChar, cardID)
        .query(`SELECT EncryptedPinCode as pass FROM PhysicalCards WHERE PhysicalCardID = @cardID`);

    return result['recordset']?.[0]?.pass ?? null;
}

const CreateFailedLogin = async (cardNumber: string): Promise<number> => {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('cardId', VarChar, cardNumber)
        .query(`INSERT INTO CardLoginTimeout (PhysicalCardID) VALUES (@cardId) SELECT SCOPE_IDENTITY() as insert_row`)

    return result['recordset']?.[0]?.insert_row;
};
