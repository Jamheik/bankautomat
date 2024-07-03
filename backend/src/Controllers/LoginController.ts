import jwt from 'jsonwebtoken'
import { Int, VarChar } from 'mssql'
import { getPoolConnection } from '../Handler/Database';

export class LoginController {

    protected readonly userId: number;
    protected readonly cardId: CardRFID;

    constructor(userId: number, cardId?: CardRFID) {
        this.userId = userId;
        if (cardId) {
            this.cardId = cardId;
        }
    }

    public async getToken() {
        if (!this.userId) {
            throw new Error("UserId isnt initialized!");
        }

        const userData = await this.getUserData();
        if (!userData) {
            throw new Error("UserId isnt valid!");
        }

        const cardData = await this.getCardDetails();
        const token = await this.getJWT({ UserID: this.userId, Email: userData.Email, CustomerID: userData.CustomerID, CardType: cardData?.label ?? null });

        if (!cardData) {
            return {
                token,
                fullName: `${userData.FirstName} ${userData.LastName}`
            };
        }

        return {
            token,
            cardType: cardData.label ?? null,
            cardData: cardData.rows ?? null,
            fullName: `${userData.FirstName} ${userData.LastName}`
        };
    }

    private async getUserData(): Promise<UserResult> {
        const poolConnection = await getPoolConnection();

        const result = await poolConnection
            .input('userID', Int, this.userId)
            .query(`SELECT u.*, c.CustomerID FROM Users u
                        INNER JOIN Customers c ON c.UserID = u.UserID
                    WHERE u.UserID = @userID`);
        return result['recordset']?.[0] ?? undefined;
    }

    private async getCardDetails(): Promise<GetCardDetails> {
        const poolConnection = await getPoolConnection();

        const result = await poolConnection
            .input('cardID', VarChar, this.cardId)
            .query(`SELECT TOP(2) c.CardType, c.CardID FROM PhysicalCards pc
                    INNER JOIN Cards c ON c.PhysicalCardID = pc.PhysicalCardID
                WHERE pc.PhysicalCardID = @cardID`);

        const str = result['recordset']?.sort((a, b) => {
            if (a.CardType === 'credit') return -1;
            if (b.CardType === 'credit') return 1;
            return 0;
        })
            ?.map(card => card.CardType)
            ?.join(' & ');

        return { label: str, rows: result['recordset'] };
    }

    private async getJWT({ UserID, CustomerID, CardType, Email }: GetJWTProps): Promise<string> {
        return await jwt.sign(
            { _id: UserID, _customerId: CustomerID, type: CardType ?? null, email: Email }, process.env.API_JWT_TOKEN, { expiresIn: "30min" }
        );
    }
}

interface GetCardDetails {
    label: string
    rows: Array<{ CardType: string, CardID: number }>
}