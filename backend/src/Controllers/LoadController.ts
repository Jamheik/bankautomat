import { Decimal, Int, SmallInt } from 'mssql';
import { getPoolConnection } from "../Handler/Database";

export class LoadCreateController {
    public static async generateNewLoad({ accountId, amount }: GenerateLoanProps): Promise<GenerateLoan> {
        const poolConnection = await getPoolConnection();

        const CreateLoad = async ({ accountId, amount }): Promise<number> => {
            const result = await poolConnection
                .input('AccountID', Int, accountId)
                .input('LoanAmount', Decimal, amount)
                .input('InterestRate', Decimal, 1)
                .input('LoanTermMonths', Int, 1)
                .query(`INSERT INTO AccountLoans (AccountID, LoanAmount, InterestRate, LoanTermMonths) VALUES (@AccountID, @LoanAmount,@InterestRate, @LoanTermMonths) SELECT SCOPE_IDENTITY() as insert_row`)

            return result['recordset']?.[0]?.insert_row;
        };

        const CreateLoadPayment = async (loadID: number): Promise<number> => {
            const result = await poolConnection
                .input('LoanID', Int, loadID)
                .input('Amount', Decimal, 0)
                .input('IsAutomaticRedemption', SmallInt, 1)
                .query(`INSERT INTO AccountLoanPayments (LoanID,Amount,PaymentDate,IsAutomaticRedemption) VALUES (@LoanID,@Amount,getdate(),@IsAutomaticRedemption) SELECT SCOPE_IDENTITY() as insert_row`)

            return result['recordset']?.[0]?.insert_row;
        };

        const UpdateAccountBalance = async({accountId, amount}): Promise<void> => {
            console.log("UpdateAccountBalance", accountId, amount)

            const poolConnection = await getPoolConnection();
            const result = await poolConnection
                .input('accountid', Int, accountId)
                .input('amount', Decimal, amount)
                .query(`UPDATE Accounts SET Balance = Balance + @amount WHERE AccountID = @accountid`);

            if (result.rowsAffected <= 0) {
                throw new Error("Something went wrong.");
            }
        }

        const loanLimit = await LoadCreateController.getAccountCreditLimit(accountId);
        const { LoanAmount, LoanPaymentAmount } = await LoadCreateController.getAccountCurrentCreditAmount(accountId);
        const currentLoanAmount = (LoanAmount - LoanPaymentAmount);

        if (loanLimit < currentLoanAmount + amount) {
            throw new Error("Cannot get more loans, gredit limit is max!");
        }

        const loadId = await CreateLoad({ accountId, amount });
        const loadPaymentId = await CreateLoadPayment(loadId);
        await UpdateAccountBalance({ accountId, amount });

        return { loadId, loadPaymentId }
    }

    public static async getAccountCreditLimit(accountId: number): Promise<number> {
        const poolConnection = await getPoolConnection();

        const result = await poolConnection
            .input('AccountID', Int, accountId)
            .query(`SELECT CreditLimit FROM Accounts a WHERE a.AccountID = @AccountID`)

        return result['recordset']?.[0]?.CreditLimit;
    }

    public static async getAccountCurrentCreditAmount(accountId: number): Promise<CreditAmount> {
        const poolConnection = await getPoolConnection();
        const result = await poolConnection
            .input('AccountID', Int, accountId)
            .query(`SELECT SUM(LoanAmount) AS LoanAmount, SUM(Amount) AS LoanPaymentAmount FROM AccountLoans al
                    INNER JOIN AccountLoanPayments alp ON alp.LoanID = al.LoanID
                    WHERE al.AccountID = @AccountID`)

        return {
            LoanAmount: result['recordset']?.[0]?.LoanAmount,
            LoanPaymentAmount: result['recordset']?.[0]?.LoanPaymentAmount,
        };
    }
}

export class LoadController {

    protected readonly accountId: CardId;
    protected loadModel: LoadModel;

    constructor(accountId: number) {
        this.accountId = accountId;
    }

    private async getAccountCreditLimit(accountId: number): Promise<number> {
        return await LoadCreateController.getAccountCreditLimit(accountId);
    }

    public async isPossibleToGetMoreLoan(accountId: number, amount: number): Promise<boolean> {
        const loanLimit = await LoadCreateController.getAccountCreditLimit(accountId);
        const { LoanAmount, LoanPaymentAmount } = await LoadCreateController.getAccountCurrentCreditAmount(accountId);
        const currentLoanAmount = (LoanAmount - LoanPaymentAmount);

        return (loanLimit > currentLoanAmount + amount);
    }

    private async getLoadData(loanId: number): Promise<void> {
        const poolConnection = await getPoolConnection();
        const result = await poolConnection
            .input('loadId', Int, loanId)
            .query(`SELECT * FROM AccountLoans al
                        LEFT JOIN AccountLoanPayments alp ON alp.LoanID = al.LoanID
                    WHERE al.LoanID = @loadId`);

        this.loadModel = result['recordset']?.[0] as LoadModel;
    }
}