import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPoolConnection } from "../../Handler/Database";
import { VarChar, Int, Decimal } from "mssql";
import { Authenticate } from "../../Routes/Middlewares/Auth";
import { CardController } from "../../Controllers/CardController";
import { LoadCreateController } from "../../Controllers/LoadController";
 
async function UserAction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const auth = await Authenticate(request, context);
        if (auth?.status !== true) return auth;
 
        const { action, id } = request.params as unknown as { action: string; id: number };
        const amountString = await request.query.get('amount');
        const amount = amountString ? parseFloat(amountString) : null;
 
        if (!action || !amount) {
            throw new Error("Invalid action");
        }
 
        const accountId = await getAccountIdByCardId(id);
        if (!accountId) {
            throw new Error("Invalid to get accountId by cardId");
        }
 
        switch (action) {
            case 'deposit':
            case 'withdraw':
                await userAccountAction({ accountId: accountId, amount, cardId: id }, action);
                break;
            default:
                throw new Error("Invalid action")
        }
 
        return {
            status: 200,
            jsonBody: true
        }
    } catch (err: any) {
        return { status: 500, body: JSON.stringify({ error: err.message }) };
    }
 
};
 
async function userAccountAction({ accountId, amount, cardId }: UserAccountAction, actionType: string): Promise<void> {
    const currentBalance = await getUserAccountBalance(accountId);
 
    if (actionType === 'withdraw') {
        const cardController = new CardController(cardId);
        await cardController.initialize();
 
        let isLoanGet = false;
 
        if (currentBalance < amount && await cardController.isCredit()) {
            const loanAmount = (amount - currentBalance);
            const { loadId, loadPaymentId } = await LoadCreateController.generateNewLoad({ accountId, amount: loanAmount });
            if (!loadId || !loadPaymentId) {
                throw new Error("Loan generation failed!");
            }
 
            isLoanGet = true;
        }
 
        if (!isLoanGet) {
            if ((amount > currentBalance || currentBalance - amount < 0)) {
                throw new Error("Doesn't have enough balance");
            }
        }
    }
 
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('accountid', Int, accountId)
        .input('amount', Decimal, amount)
        .input('actionType', VarChar, actionType)
        .query(`UPDATE Accounts SET Balance = 
            CASE 
                WHEN @actionType = 'deposit' THEN Balance + @amount
                WHEN @actionType = 'withdraw' THEN Balance - @amount
            END 
            WHERE AccountID = @accountid`, { actionType });
 
    if (result.rowsAffected <= 0) {
        throw new Error("Something went wrong.");
    }
 
    await addUserAccountTransactionHistory({ accountId, amount, type: actionType, target: 'bank', cardId });
}
 
async function getUserAccountBalance(accountId: number): Promise<number> {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('accountid', Int, accountId)
        .query(`SELECT Balance FROM Accounts WHERE AccountID = @accountid`);
 
    return result.recordset?.[0]?.Balance ?? 0;
}
 
export async function getAccountIdByCardId(cardId: number): Promise<number | null> {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('cardId', Int, cardId)
        .query(`SELECT AccountID FROM Cards WHERE CardID = @cardId`);
 
    return result.recordset?.[0]?.AccountID ?? null;
}
 
async function getUserAccountByCardId(cardId: number): Promise<number> {
    const poolConnection = await getPoolConnection();
    const result = await poolConnection
        .input('cardId', Int, cardId)
        .query(`SELECT AccountID FROM Cards WHERE CardID = @cardId`);
 
    return result.recordset?.[0]?.AccountID ?? 0;
}
 
async function addUserAccountTransactionHistory({ accountId, type, amount, target }: TransactionHistoryProps): Promise<void> {
    const poolConnection = await getPoolConnection();
 
    await poolConnection
        .input('AccountID', Int, accountId)
        .input('TransactionTarget', VarChar, target)
        .input('TransactionType', VarChar, type)
        .input('Amount', Decimal, amount)
        .query(`INSERT INTO AccountTransactions (AccountID, TransactionTarget, TransactionType, Amount) VALUES (@AccountID, @TransactionTarget, @TransactionType, @Amount)`);
}
 
app.http('user-account-action', {
    route: "user/accounts/{id}/action/{action}",
    methods: ['POST', 'GET'],
    authLevel: 'anonymous',
    handler: UserAction
});