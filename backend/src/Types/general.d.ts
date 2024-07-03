type CardRFID = string
type CardId = number

interface UserCreateProps {
    FirstName: string,
    LastName: string,
    Email: string,
    Password: string
}

type AuthToken = {
    _id: number,
    Email: string,
    iat: number,
    exp: number
}

interface CreateCustomerRowProps {
    userId: number
}

interface CreatePerson {
    LastName: string, FirstName: string, Email: string, CustomerID: number, UserID: number
}

interface GetJWTProps {
    UserID: number, CustomerID: number, CardType?: string, Email: string
}

interface UserResult {
    UserID: number
    FirstName: string
    LastName: string
    Email: string
    CustomerID: number
}
interface UserAccountAction {
    accountId: number;
    amount: number;
    cardId: number
}

interface TransactionHistoryProps extends UserAccountAction {
    type: string;
    target: string;
}

interface AccountModel {
    AccountID: number;
    AccountNumber: string;
    CustomerID: number;
    Balance: number;
    CreditLimit: number;
}

interface CardModel {
    CardID: number
    PhysicalCardID: number
    CardType: string
    CardNumber: string
    ExpiryDate: Date
    AccountID: number
}

interface TransactionHistory {
    TransactionID: number
    AccountID: number
    TransactionTarget: string
    TransactionData: string
    TransactionType: string
    Amount: number
    TransactionDate: Date
}

interface GenerateLoanProps {
    accountId: number, amount: number
}

interface GenerateLoan {
    loadId: number, loadPaymentId: number
}

interface CreditAmount {
    LoanAmount: number
    LoanPaymentAmount: number
}

interface LoadModel { }
