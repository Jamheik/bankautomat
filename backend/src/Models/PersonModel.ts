import { getPoolConnection } from "../Handler/Database";
import Person from "./DataModels/Person";
import { Int } from 'mssql'

export class PersonModel {

    protected userId: number;
    protected _personData: Person;

    public get personData(): Person {
        return this._personData;
    }

    public set personData(value: Person) {
        this._personData = value;
    }

    constructor(personId?: number) {
        if (personId) {
            this.userId = personId;
        }
    }

    public async getPersonData(): Promise<void> {
        const id = this.userId;
        const poolConnection = await getPoolConnection();

        const result = await poolConnection
            .input('userId', Int, id)
            .query(`SELECT u.UserID, u.Email, u.FirstName, u.LastName, c.CustomerID FROM Users u
                INNER JOIN Customers c ON c.UserID = u.UserID
            WHERE u.UserID = @userId`);

        this._personData = result['recordset']?.[0];
    }

}