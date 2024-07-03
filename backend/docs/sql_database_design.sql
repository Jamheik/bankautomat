CREATE TABLE [PhysicalCards] (
  [PhysicalCardID] VARCHAR(128) NOT NULL,
  [CustomerID] INT,
  [EncryptedPinCode] VARCHAR(128) NOT NULL,
  PRIMARY KEY ([PhysicalCardID])
)
GO

CREATE TABLE [CreditCardLoans] (
  [LoanID] INT NOT NULL,
  [CardID] INT NOT NULL,
  PRIMARY KEY ([LoanID])
)
GO

CREATE TABLE [AccountLoanPayments] (
  [PaymentID] INT NOT NULL,
  [LoanID] INT NOT NULL,
  [Amount] DECIMAL(10,2) NOT NULL,
  [PaymentDate] DATE NOT NULL,
  [IsAutomaticRedemption] SMALLINT NOT NULL DEFAULT '0',
  PRIMARY KEY ([PaymentID])
)
GO

CREATE TABLE [Cards] (
  [CardID] INT NOT NULL,
  [PhysicalCardID] VARCHAR(128) NOT NULL,
  [CardType] VARCHAR(20) NOT NULL,
  [CardNumber] VARCHAR(20) NOT NULL,
  [ExpiryDate] DATE NOT NULL,
  [AccountID] INT NOT NULL,
  PRIMARY KEY ([CardID])
)
GO

CREATE TABLE [AccountTransactions] (
  [TransactionID] BIGINT NOT NULL,
  [AccountID] INT NOT NULL,
  [TransactionTarget] VARCHAR(255),
  [TransactionData] NVARCHAR(255),
  [TransactionType] VARCHAR(255) NOT NULL,
  [Amount] DECIMAL(10,2) NOT NULL,
  [TransactionDate] DATETIME NOT NULL,
  PRIMARY KEY ([TransactionID])
)
GO

CREATE TABLE [Accounts] (
  [AccountID] INT NOT NULL,
  [AccountNumber] VARCHAR(20) NOT NULL,
  [CustomerID] INT NOT NULL,
  [Balance] DECIMAL(10,2) NOT NULL,
  [CreditLimit] DECIMAL(10,2) NOT NULL,
  PRIMARY KEY ([AccountID])
)
GO

CREATE TABLE [Users] (
  [UserID] INT NOT NULL,
  [FirstName] VARCHAR(50),
  [LastName] VARCHAR(50),
  [Email] VARCHAR(100),
  [Password] VARCHAR(100),
  [createdAt] DATE,
  PRIMARY KEY ([UserID])
)
GO

CREATE TABLE [AccountLoans] (
  [LoanID] INT NOT NULL,
  [AccountID] INT NOT NULL,
  [LoanAmount] DECIMAL(10,2) NOT NULL,
  [InterestRate] DECIMAL(5,2) NOT NULL,
  [LoanTermMonths] INT NOT NULL,
  [LoanStartDate] DATE NOT NULL,
  PRIMARY KEY ([LoanID])
)
GO

CREATE TABLE [Customers] (
  [CustomerID] INT NOT NULL,
  [UserID] INT NOT NULL,
  PRIMARY KEY ([CustomerID])
)
GO

CREATE UNIQUE INDEX [cards_cardnumber_unique] ON [Cards] ("CardNumber")
GO

CREATE UNIQUE INDEX [accounts_accountnumber_unique] ON [Accounts] ("AccountNumber")
GO

CREATE UNIQUE INDEX [users_email_unique] ON [Users] ("Email")
GO

CREATE UNIQUE INDEX [Customers_index_3] ON [Customers] ("UserID")
GO

ALTER TABLE [AccountLoans] ADD CONSTRAINT [accountloans_loanid_foreign] FOREIGN KEY ([LoanID]) REFERENCES [CreditCardLoans] ([LoanID])
GO

ALTER TABLE [Cards] ADD CONSTRAINT [cards_accountid_foreign] FOREIGN KEY ([AccountID]) REFERENCES [Accounts] ([AccountID])
GO

ALTER TABLE [AccountLoanPayments] ADD CONSTRAINT [accountloanpayments_loanid_foreign] FOREIGN KEY ([LoanID]) REFERENCES [AccountLoans] ([LoanID])
GO

ALTER TABLE [AccountLoans] ADD CONSTRAINT [accountloans_accountid_foreign] FOREIGN KEY ([AccountID]) REFERENCES [Accounts] ([AccountID])
GO

ALTER TABLE [AccountTransactions] ADD CONSTRAINT [accounttransactions_accountid_foreign] FOREIGN KEY ([AccountID]) REFERENCES [Accounts] ([AccountID])
GO

ALTER TABLE [PhysicalCards] ADD CONSTRAINT [physicalcards_customerid_foreign] FOREIGN KEY ([CustomerID]) REFERENCES [Customers] ([CustomerID])
GO

ALTER TABLE [Accounts] ADD CONSTRAINT [accounts_customerid_foreign] FOREIGN KEY ([CustomerID]) REFERENCES [Customers] ([CustomerID])
GO

ALTER TABLE [CreditCardLoans] ADD CONSTRAINT [creditcardloans_cardid_foreign] FOREIGN KEY ([CardID]) REFERENCES [Cards] ([CardID])
GO

ALTER TABLE [Customers] ADD CONSTRAINT [customers_userid_foreign] FOREIGN KEY ([UserID]) REFERENCES [Users] ([UserID])
GO

ALTER TABLE [Cards] ADD CONSTRAINT [cards_physicalcardid_foreign] FOREIGN KEY ([PhysicalCardID]) REFERENCES [PhysicalCards] ([PhysicalCardID])
GO

ALTER TABLE [AccountLoans] ADD FOREIGN KEY ([LoanTermMonths]) REFERENCES [Cards] ([AccountID])
GO
