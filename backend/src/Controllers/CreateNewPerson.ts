import { VarChar, Int } from 'mssql'
import Person from "../Models/DataModels/Person";
import { PasswordManager } from "./PasswordManager";
import { getPoolConnection } from "../Handler/Database";

export const CreateNewUser = async ({ LastName, FirstName, Email, Password }: Person): Promise<CreatePerson> => {

    try {
        /* Handling duplicate email */
        const emailExists = await getPersonEmailAmount({ Email } as Person);
        if (emailExists > 0) {
            throw new Error('Email is already in system.')
        }

        /* Handling password & password hashing */
        const passManager = new PasswordManager(Password);
        const passHash = await passManager.hashPasswordString();

        if (!passHash) {
            throw new Error('Password hashing get some error, please try again new password.')
        }

        /* Changing readable STRING password to hashed one. */
        Password = passHash;

        const User = await createUserRow({ LastName, FirstName, Email, Password });
        const customers = await createCustomerRow({ userId: User });

        return {
            LastName, FirstName, Email, CustomerID: customers, UserID: User
        }
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

const createCustomerRow = async ({ userId }: CreateCustomerRowProps): Promise<number> => {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('userId', Int, userId)
        .query(`INSERT INTO Customers (UserID) VALUES (@userId) SELECT SCOPE_IDENTITY() as insert_row`)

    return result['recordset']?.[0]?.insert_row;
};

const createUserRow = async ({ LastName, FirstName, Email, Password }: Person): Promise<number> => {
    const poolConnection = await getPoolConnection();

    const result = await poolConnection
        .input('firstname', VarChar, FirstName)
        .input('lastname', VarChar, LastName)
        .input('email', VarChar, Email)
        .input('password', VarChar, Password)
        .query(`INSERT INTO Users (FirstName, LastName, Email, Password) VALUES (@firstname,@lastname,@email,@password); SELECT SCOPE_IDENTITY() as insert_row`)

    return result['recordset']?.[0]?.insert_row;
};


const getPersonEmailAmount = async ({ Email }: Person): Promise<number> => {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('email', VarChar, Email)
        .query(`SELECT COUNT(Email) as amount FROM Users WHERE Email = @email`);

    return result['recordset']?.[0]?.amount ?? 0;
}

