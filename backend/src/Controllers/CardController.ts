import { Int } from 'mssql';
import { getPoolConnection } from "../Handler/Database";

export class CardController {

    protected readonly cardId: CardId;
    public cardModel: CardModel | undefined;
    public accountModel: AccountModel | undefined;

    constructor(cardId: CardId) {
        this.cardId = cardId;
    }

    public async initialize(): Promise<void> {
        await Promise.all([this.getLinkedAccountData(), this.getLinkedCardData()]);
    }

    public async getAccountBalance(): Promise<number> {
        if (!this.accountModel) {
            throw new Error("Cannot get balance, make sure that model is correctly builded.")
        }

        return this.accountModel?.Balance ?? 0;
    }

    public async getAccountCreditLimit(): Promise<number> {
        if (!this.accountModel) {
            throw new Error("Cannot get balance, make sure that model is correctly builded.")
        }

        return this.accountModel?.CreditLimit ?? 0;
    }

    public async getCardType(): Promise<string> {
        if (!this.cardModel) {
            throw new Error("Cannot get balance, make sure that model is correctly builded.")
        }

        return this.cardModel.CardType;
    }

    public async isCredit(): Promise<boolean> {
        if (!this.cardModel) {
            throw new Error("Cannot get balance, make sure that model is correctly builded.")
        }

        return (this.cardModel.CardType == "credit");
    }

    private async getLinkedAccountData(): Promise<void> {
        const poolConnection = await getPoolConnection();
        const result = await poolConnection
            .input('cardId', Int, this.cardId)
            .query(`SELECT a.* FROM Cards c
                        INNER JOIN Accounts a ON a.AccountID = c.AccountID
                    WHERE c.CardID = @cardId`);

        this.accountModel = result['recordset']?.[0] as AccountModel;
    }

    private async getLinkedCardData(): Promise<void> {
        const poolConnection = await getPoolConnection();
        const result = await poolConnection
            .input('cardId', Int, this.cardId)
            .query(`SELECT * FROM Cards c WHERE c.CardID = @cardId`);

        this.cardModel = result['recordset']?.[0] as CardModel;
    }

    public async getAccountTransaction(page: number = 0, limit: number = 5): Promise<TransactionHistory[]> {
        const poolConnection = await getPoolConnection();

        const accountId = this.accountModel?.AccountID;
        const pageIndex = limit * page;

        const result = await poolConnection
            .input('accountId', Int, accountId)
            .input('pageIndex', Int, pageIndex)
            .input('limitAmount', Int, limit)
            .query(`SELECT * FROM AccountTransactions at WHERE at.AccountID = @accountId 
                    ORDER BY at.TransactionDate DESC OFFSET @pageIndex ROWS FETCH NEXT @limitAmount ROWS ONLY`);

        return result['recordset'] as TransactionHistory[];
    }
}