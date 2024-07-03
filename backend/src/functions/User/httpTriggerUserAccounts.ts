import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CardController } from "../../Controllers/CardController";
import { getAccountIdByCardId } from "./ActionRouter";
import { LoadCreateController } from "../../Controllers/LoadController";
import { Authenticate } from "../../Routes/Middlewares/Auth";

async function UserInformation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const auth = await Authenticate(request, context);
        if (auth?.status !== true) return auth;

        const { id, action } = request.params as unknown as { id: number, action?: string };
        if (!id) {
            throw new Error("Invalid Card id");
        }

        const cardModel = new CardController(id);
        await cardModel.initialize();

        const pageString = await request.query.get('page');
        const page = pageString ? parseFloat(pageString) : 0;
        const transactions = await cardModel.getAccountTransaction(page);


        const accountId = await getAccountIdByCardId(id);
        if (!accountId) {
            throw new Error("Invalid account id");
        }

        const { LoanAmount, LoanPaymentAmount } = await LoadCreateController.getAccountCurrentCreditAmount(accountId);
        const currentLoanAmount = (LoanAmount - LoanPaymentAmount);

        let result;

        switch (action) {
            case 'transaction':
                result = { transactions: await stripTransactionDetails(transactions) }
                break;
            default:
                result = {
                    cardType: await cardModel.getCardType(),
                    balance: await cardModel.getAccountBalance(),
                    creditLimit: await cardModel.getAccountCreditLimit(),
                    currentLoanAmount: currentLoanAmount ?? 0,
                    transactions: await stripTransactionDetails(transactions),
                }
        }

        return { jsonBody: result };
    } catch (err: any) {
        return { status: 500, body: JSON.stringify({ error: err.message }) };
    }
};

const stripTransactionDetails = async (transactions): Promise<any[]> => {
    return transactions.map(({ TransactionID, AccountID, ...rest }) => rest);
}

app.http('user-card-data', {
    route: "user/card/{id}/{action?}",
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: UserInformation
});