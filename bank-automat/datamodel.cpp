#include "datamodel.h"


DataModel::DataModel() {}

void DataModel::SetCardNumber(QString newCard)
{
    cardNumber = newCard;
}

void DataModel::SetWebToken(QJsonValue token)
{
    webToken = token.toString();
}

void DataModel::SetWebCardType(QJsonValue type)
{
    cardType = type.toString();
}

void DataModel::SetWebCardId(int cardid)
{
    cardId = cardid;
}

void DataModel::SetWebUserFName(QJsonValue fullName)
{
    userFName = fullName.toString();
}

void DataModel::SetBalance(double bal)
{
    balance = bal;
}

void DataModel::SetCurrentCredit(double Cred)
{
    currentCredit = Cred;
}

void DataModel::SetCreditLimit(double CredLim)
{
    creditLimit = CredLim;
}

void DataModel::SetCardData(QJsonValue JsonCardData) {
    CardData = JsonCardData;
}

QJsonValue DataModel::GetCardData() {
    return CardData;
}

QString DataModel::GetCardNumber()
{
    return cardNumber;
}

QString DataModel::GetWebToken()
{
    return webToken;
}

QString DataModel::GetWebCardType()
{
    return cardType;
}

int DataModel::GetWebCardId()
{
    return cardId;
}

QString DataModel::GetWebUserFName()
{
    return userFName;
}

void DataModel::ClearValues(){
    cardId = 0;
    CardData = "";
    cardNumber.clear();
    webToken.clear();
    cardType.clear();
    userFName.clear();
}

double DataModel::GetBalance()
{
    return balance;
}

double DataModel::GetCurrentCredit()
{
    return currentCredit;
}

double DataModel::GetCreditLimit()
{
    return creditLimit;
}
