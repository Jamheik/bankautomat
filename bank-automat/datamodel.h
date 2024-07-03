#ifndef DATAMODEL_H
#define DATAMODEL_H

#include <QString>
#include <QJsonDocument>
#include <QJsonValue>

class DataModel
{
public:
    DataModel();

    /* Setters */
    static void SetCardNumber(QString cardNumber);
    static void SetWebToken(QJsonValue token);
    static void SetWebCardType(QJsonValue type);
    static void SetWebUserFName(QJsonValue fullName);
    
    static void SetBalance(double bal);
    static void SetCurrentCredit(double Cred);
    static void SetCreditLimit(double CredLim);

    static void SetWebCardId(int cardid);

    static void SetCardData(QJsonValue JsonCardData) ;

    /* Getters */
    static QString GetCardNumber();
    static QString GetWebToken();
    static QString GetWebCardType();
    static QString GetWebUserFName();
    static int GetWebCardId();
    static QJsonValue GetCardData();
    static void ClearValues();

    static double GetBalance();
    static double GetCurrentCredit();
    static double GetCreditLimit();

protected:
    static inline QString cardNumber;
    static inline QString webToken;
    static inline QString cardType;
    static inline QString userFName;
    static inline int cardId;
    static inline QJsonValue CardData;
    static inline double balance;
    static inline double currentCredit;
    static inline double creditLimit;
};

#endif // DATAMODEL_H
