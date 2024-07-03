#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "environment.h"
#include <QStackedWidget>
#include "environment.h"
#include "pageindex.h"
#include <QMessageBox>
#include <datamodel.h>

MainWindow::MainWindow(QWidget *parent): QMainWindow(parent), ui(new Ui::MainWindow) {
    ui->setupUi(this);

    ui->stackedWidget->setCurrentIndex(Pageindex::LANDING_VIEW);
    qDebug() << ui->stackedWidget->currentIndex();

    ui->Wotherwidget->hide();

    // Initialize serial port
    serialPort = new QSerialPort(this);
    QSerialPortInfo selectedPort;

    // Iterate through available serial ports
    for (const QSerialPortInfo &portInfo : QSerialPortInfo::availablePorts()) {
        qDebug() << "Port:" << portInfo.portName() << "Manufacturer:" << portInfo.manufacturer();

        // Check for desired manufacturers
        if (portInfo.manufacturer().contains("Microsoft") || portInfo.manufacturer().contains("Olimex Ltd.")) {
            selectedPort = portInfo;
            break; // Found desired manufacturer, exit loop
        }
    }

    // Check if a suitable port was found
    if (!selectedPort.isNull()) {
        serialPort->setPortName(selectedPort.portName());
        qDebug() << "Selected serial port:" << selectedPort.portName();

        // Configure serial port settings
        serialPort->setBaudRate(QSerialPort::Baud9600);
        serialPort->setDataBits(QSerialPort::Data8);
        serialPort->setParity(QSerialPort::NoParity);
        serialPort->setStopBits(QSerialPort::OneStop);

        // Attempt to open serial port
        if (serialPort->open(QIODevice::ReadWrite)) {
            qDebug() << "Serial port opened successfully";
        } else {
            qDebug() << "Error opening serial port:" << serialPort->errorString();
        }

        qDebug() << "Serial port name:" << selectedPort.portName();

        // Connect readyRead signal to readData slot
        connect(serialPort, &QSerialPort::readyRead, this, &MainWindow::readData);
        serialPort->clear(); // Clear any existing data in serial port buffer
    } else {
        qDebug() << "RFID reader not found.";
    }
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::setAuthHeaders(QNetworkRequest &request)
{
    QString myToken = "Bearer " + DataModel::GetWebToken().toUtf8();
    request.setRawHeader(QByteArray("Authorization"), myToken.toUtf8());
}

void MainWindow::Cleareverything()
{
    ui->lineEditWdrawAmount->clear();
    ui->linePin->clear();
    ui->lineWdraw->clear();
    ui->Wotherwidget->hide();
    ui->labelLoginErr->clear();
}

void MainWindow::readData()
{
    ui->labelLoginErr->clear();

    if ( DataModel::GetCardNumber().isNull() || DataModel::GetCardNumber().isEmpty()) {
        QByteArray responseData = serialPort->readAll();
        QString response(responseData);
        QStringList lines = response.split("\r\n", Qt::SkipEmptyParts);

        // Create a QNetworkAccessManager instance
        manager = new QNetworkAccessManager(this);

        foreach (QString line, lines) {
            if (line.startsWith("-")) {
                QString cardNumber = line.mid(1, line.indexOf(">") - 1);

                // Create a QNetworkRequest with the desired URL
                QNetworkRequest request(QUrl(Environment::getBaseUrl() + "/auth/cards?id=" + cardNumber));

                // Perform the GET request
                reply = manager->get(request);

                // Connect signals and slots to handle the response
                QObject::connect(reply, &QNetworkReply::finished, [=]() {
                    if (reply->error() == QNetworkReply::NoError) {
                        // If the request is successful, read the response data
                        QByteArray responseData = reply->readAll();
                        QJsonDocument data = QJsonDocument::fromJson(responseData);
                        if (data.object().value("status").toBool()) {
                            DataModel::SetCardNumber(cardNumber);

                            ui->stackedWidget->setCurrentIndex(Pageindex::PIN_VIEW);
                        }

                        qDebug() << "Response:" << responseData;
                    }
                    else {
                        // If an error occurred, display the error message
                        qDebug() << "Error:" << reply->errorString();
                    }

                    // Clean up resources
                    reply->deleteLater();
                    manager->deleteLater(); // Make sure to clean up the manager
                });

                qDebug() << "Card readed:" << cardNumber;
            }
        }
    }
}

void MainWindow::SetWithdrawAmount(QString str)
{
    ui->lineEditWdrawAmount->clear();
    ui->lineEditWdrawAmount->setText(str);
}

void MainWindow::on_btnPin1_clicked()
{
    updatePinText(1);
}

void MainWindow::updatePinText(int num)
{
    QString text = ui->linePin->text();
    text += QString::number(num);
    ui->linePin->setText(text);
}

void MainWindow::on_btnPin2_clicked()
{
    updatePinText(2);
}

void MainWindow::on_btnPin3_clicked()
{
    updatePinText(3);
}

void MainWindow::on_btnPin4_clicked()
{
    updatePinText(4);
}

void MainWindow::on_btnPin5_clicked()
{
    updatePinText(5);
}

void MainWindow::on_btnPin6_clicked()
{
    updatePinText(6);
}

void MainWindow::on_btnPin7_clicked()
{
    updatePinText(7);
}

void MainWindow::on_btnPin8_clicked()
{
    updatePinText(8);
}

void MainWindow::on_btnPin9_clicked()
{
    updatePinText(9);
}

void MainWindow::on_btnPin0_clicked()
{
    updatePinText(0);
}

void MainWindow::on_btnPinCancel_clicked()
{
    ui->linePin->clear();
}

void MainWindow::on_btnPinOk_clicked()
{
    manager = new QNetworkAccessManager(this);

    QUrl requestURL = QUrl(Environment::getBaseUrl() + "auth/cards/validate?id="+ DataModel::GetCardNumber() +"&pass=" + ui->linePin->text());

    QNetworkRequest request(requestURL);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    reply = manager->post(request, "");

    QObject::connect(reply, &QNetworkReply::finished, [=]() {
        QByteArray responseData = reply->readAll();
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument data = QJsonDocument::fromJson(responseData);

            DataModel::SetWebToken( data.object().value("token") );
            DataModel::SetWebCardType( data.object().value("cardType") );
            DataModel::SetWebUserFName( data.object().value("fullName") );

            DataModel::SetCardData( data.object().value("cardData") );

            if (DataModel::GetWebCardType() == "credit & debit") {
                ui->labelDeCreWelcome->setText("Welcome " + DataModel::GetWebUserFName() );
                ui->stackedWidget->setCurrentIndex(Pageindex::DEBITCREDIT_VIEW);
            } else {

                QJsonArray array = DataModel::GetCardData().toArray();

                auto getCardIdByType = [&array](const QString& cardType) -> int {
                    for (const auto& value : array) {
                        QJsonObject obj = value.toObject();
                        if (obj["CardType"].toString() == cardType) {
                            return obj["CardID"].toInt();
                        }
                    }
                    return -1; // Return -1 if cardType is not found
                };

                int cardId = getCardIdByType( DataModel::GetWebCardType() );

                if (cardId == -1) {
                    return;
                }

                DataModel::SetWebCardId(cardId);

                ui->labelHomeWelcome->setText("Welcome " + DataModel::GetWebUserFName());
                ui->stackedWidget->setCurrentIndex(Pageindex::HOME_VIEW);
            }

            qDebug() << "Response:" << responseData;

        } else {
            qDebug() << "Error:" << reply->errorString();
            ui->linePin->clear();

            ui->labelLoginErr->setText(responseData);
        }

        reply->deleteLater();
        manager->deleteLater(); });
}

void MainWindow::on_pushButton_clicked()
{
    logOut();
    Cleareverything();
}

void MainWindow::on_p2btnLogout_clicked()
{
    logOut();
    Cleareverything();
}

void MainWindow::on_btnHomeLogout_clicked()
{
    logOut();
    Cleareverything();
}

void MainWindow::on_btnWdraw20_clicked()
{
    this->SetWithdrawAmount("20€");
}

void MainWindow::on_btnWdraw40_clicked()
{
    this->SetWithdrawAmount("40€");
}

void MainWindow::on_btnWdraw50_clicked()
{
    this->SetWithdrawAmount("50€");
}

void MainWindow::on_btnWdraw100_clicked()
{
    this->SetWithdrawAmount("100€");
}

void MainWindow::on_btnWdrawReturn_clicked()
{
    ui->stackedWidget->setCurrentIndex(Pageindex::HOME_VIEW);
    ui->Wotherwidget->hide();
}

void MainWindow::on_btnWithdraw_clicked()
{
    ui->labelWdrawWelcome->setText("Welcome " + DataModel::GetWebUserFName());
   ui->stackedWidget->setCurrentIndex(Pageindex::WITHDRAW_VIEW);
}

void MainWindow::on_btnDebit_clicked()
{
    QJsonArray array = DataModel::GetCardData().toArray();
    auto getCardIdByType = [&array](const QString& cardType) -> int {
        for (const auto& value : array) {
            QJsonObject obj = value.toObject();
            if (obj["CardType"].toString() == cardType) {
                return obj["CardID"].toInt();
            }
        }
        return -1; // Return -1 if cardType is not found
    };

    int cardId = getCardIdByType("debit");
    if (cardId == -1) {
        return;
    }
    DataModel::SetWebCardId(cardId);

    qDebug() << cardId;

    ui->labelHomeWelcome->setText("Welcome " + DataModel::GetWebUserFName());
    ui->stackedWidget->setCurrentIndex(Pageindex::HOME_VIEW);
}

void MainWindow::on_btnCredit_clicked()
{
    QJsonArray array = DataModel::GetCardData().toArray();
    auto getCardIdByType = [&array](const QString& cardType) -> int {
        for (const auto& value : array) {
            QJsonObject obj = value.toObject();
            if (obj["CardType"].toString() == cardType) {
                return obj["CardID"].toInt();
            }
        }
        return -1; // Return -1 if cardType is not found
    };

    int cardId = getCardIdByType("credit");
    if (cardId == -1) {
        return;
    }

    DataModel::SetWebCardId(cardId);

    qDebug() << cardId;

    ui->labelHomeWelcome->setText("Welcome " + DataModel::GetWebUserFName());
    ui->stackedWidget->setCurrentIndex(Pageindex::HOME_VIEW);
}

void MainWindow::on_btnWdraw_clicked()
{
    manager = new QNetworkAccessManager(this);

    QUrl requestURL = QUrl(Environment::getBaseUrl() + "user/accounts/"+  QString::number(DataModel::GetWebCardId()) +"/action/withdraw/?amount=" + ui->lineEditWdrawAmount->text());

    QNetworkRequest request(requestURL);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    MainWindow::setAuthHeaders(request);

    reply = manager->post(request, "");

    QObject::connect(reply, &QNetworkReply::finished, [=]() {
        if (reply->error() == QNetworkReply::NoError) {
            QByteArray responseData = reply->readAll();
            QJsonDocument data = QJsonDocument::fromJson(responseData);
            if(reply->error() == QNetworkReply::NoError){
                QMessageBox msg;
                QString wdrawAmount = ui->lineEditWdrawAmount->text();
                QString text = "You withdrew " + wdrawAmount;
                msg.setText(text);
                msg.exec();
            }
            qDebug() << "Response:" << responseData;

        } else {
            qDebug() << "Error:" << reply->errorString();
            ui->labelLoginErr->setText("Incorrect pin");
            ui->linePin->clear();
        }

        reply->deleteLater();
        manager->deleteLater(); 
    });
}

void MainWindow::on_btnWdrawLogout_clicked()
{
    logOut();
    Cleareverything();
}

void MainWindow::handleTransactionViewPageData(int page) {
    manager = new QNetworkAccessManager(this);

    qDebug() << page;

    QUrl requestURL = QUrl(Environment::getBaseUrl() + "user/card/"+ QString::number(DataModel::GetWebCardId()) +"/transaction?page=" + QString::number(page));

    QNetworkRequest request(requestURL);

    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    MainWindow::setAuthHeaders(request);

    reply = manager->get(request);

    QObject::connect(reply, &QNetworkReply::finished, [=]() {
        if (reply->error() == QNetworkReply::NoError) {
            QByteArray responseData = reply->readAll();
            QJsonDocument data = QJsonDocument::fromJson(responseData);

            transactionHistory = data.object().value("transactions");

            historyPageIndex = page;

            qDebug() << "Response:" << responseData;
            MainWindow::updateTransactionData();

            ui->stackedWidget->setCurrentIndex(Pageindex::HISTORY_VIEW);
        } else {
            qDebug() << "Error:" << reply->errorString();
        }

        reply->deleteLater();
        manager->deleteLater();
    });
}

void MainWindow::updateTransactionData() {
    QJsonArray array = transactionHistory.toArray();

    QLabel *historyLabels[] = { ui->history1, ui->history2, ui->history3, ui->history4, ui->history5 };

    int numTransactions = array.size();
    for (int i = 0; i < numTransactions && i < 5; ++i) {
        QJsonObject transaction = array[i].toObject();
        QString amount = QString::number(transaction.value("Amount").toInt());
        QString transactionType = transaction.value("TransactionType").toString();
        QString transactionDateStr = transaction.value("TransactionDate").toString();

        // Parse ISO 8601 date
        QDateTime transactionDate = QDateTime::fromString(transactionDateStr, Qt::ISODate);
        transactionDate = transactionDate.toTimeZone(QTimeZone("UTC+2"));

        QString formattedDate = transactionDate.toString("yyyy-MM-dd hh:mm:ss");

        QString labelText = QString("%1€ - %2 - %3").arg(amount, transactionType, formattedDate);

        historyLabels[i]->setText(labelText);
    }

    for (int i = numTransactions; i < 5; ++i) {
        historyLabels[i]->clear();
    }
}

void MainWindow::on_btnHistory_clicked()
{
    ui->labelWelcHis->setText("Welcome " + DataModel::GetWebUserFName());

    MainWindow::handleTransactionViewPageData(0);
}

void MainWindow::on_return_h_clicked()
{
    ui->stackedWidget->setCurrentIndex(Pageindex::HOME_VIEW);
}

void MainWindow::on_log_out_clicked()
{
    logOut();
    Cleareverything();
}
void MainWindow::on_btnHomeLogout_2_clicked()
{
    logOut();
    Cleareverything();
}

void MainWindow::on_btnWdrawLogout_4_clicked()
{
    logOut();
    Cleareverything();
}

void MainWindow::on_btnWdrawReturn_4_clicked()
{
    ui->stackedWidget->setCurrentIndex(Pageindex::HOME_VIEW);
}

void MainWindow::on_btnHisReturn_clicked()
{
    ui->stackedWidget->setCurrentIndex(Pageindex::HOME_VIEW);
}


void MainWindow::on_btnBalance_clicked()
{
    // Create a QNetworkAccessManager instance
    manager = new QNetworkAccessManager(this);

    // Create a QNetworkRequest with the desired URL
    QNetworkRequest request(QUrl(Environment::getBaseUrl() + "user/card/" + QString::number(DataModel::GetWebCardId())));

    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    MainWindow::setAuthHeaders(request);
    // Perform the GET request
    reply = manager->get(request);

     // Connect signals and slots to handle the response
    QObject::connect(reply, &QNetworkReply::finished, [=]() {
        if (reply->error() == QNetworkReply::NoError)
        {
            QByteArray responseData = reply->readAll();
            QJsonDocument data = QJsonDocument::fromJson(responseData);
            // If the request is successful, read the response data
            DataModel::SetBalance(data.object().value("balance").toDouble());
            ui->Debit_balance->setText(QString::number(DataModel::GetBalance()));
            DataModel::SetCreditLimit(data.object().value("creditLimit").toDouble());
            ui->Credit_used->setText(QString::number(DataModel::GetCreditLimit()));
            DataModel::SetCurrentCredit(data.object().value("Amount").toDouble());
            ui->Credit_used_2->setText(QString::number(DataModel::GetCurrentCredit()));
            ui->stackedWidget->setCurrentIndex(Pageindex::BALANCE_VIEW);

            ui->labelBalWelcome->setText("Welcome " + DataModel::GetWebUserFName());

            qDebug() << "Response:" << responseData;
        }
        else
        {
            // If an error occurred, display the error message
            qDebug() << "Error:" << reply->errorString();
        }

        // Clean up resources
        reply->deleteLater();
        manager->deleteLater(); // Make sure to clean up the manager
    });
}

void MainWindow::on_btnBalReturn_clicked()
{
    ui->stackedWidget->setCurrentIndex(Pageindex::HOME_VIEW);
}
void MainWindow::logOut(){
    ui->stackedWidget->setCurrentIndex(Pageindex::LANDING_VIEW);
    DataModel::ClearValues();
}

void MainWindow::on_btnWdrawother_clicked()
{
    ui->Wotherwidget->show();
}


void MainWindow::on_btnDeCreLogout_clicked()
{
    logOut();
    Cleareverything();
}


void MainWindow::updateWdrawText(int num)
{
    QString text = ui->lineWdraw->text();
    text += QString::number(num);
    ui->lineWdraw->setText(text);
}


void MainWindow::on_Wdrawbtn1_clicked()
{
    updateWdrawText(1);
}

void MainWindow::on_Wdrawbtn2_clicked()
{
   updateWdrawText(2);
}

void MainWindow::on_Wdrawbtn3_clicked()
{
  updateWdrawText(3);
}

void MainWindow::on_Wdrawbtn4_clicked()
{
    updateWdrawText(4);
}

void MainWindow::on_Wdrawbtn5_clicked()
{
    updateWdrawText(5);
}

void MainWindow::on_Wdrawbtn6_clicked()
{
    updateWdrawText(6);
}

void MainWindow::on_Wdrawbtn7_clicked()
{
    updateWdrawText(7);
}

void MainWindow::on_Wdrawbtn8_clicked()
{
    updateWdrawText(8);
}

void MainWindow::on_Wdrawbtn9_clicked()
{
    updateWdrawText(9);
}

void MainWindow::on_Wdrawbtn0_clicked()
{
    updateWdrawText(0);
}

void MainWindow::on_Wdrawcancel_clicked()
{
    ui->lineWdraw->clear();
}



void MainWindow::on_Wdrawok_clicked()
{
     manager = new QNetworkAccessManager(this);

     QUrl requestURL = QUrl(Environment::getBaseUrl() + "user/accounts/4/action/withdraw/?amount=" + ui->lineWdraw->text());

     QNetworkRequest request(requestURL);
     request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

     MainWindow::setAuthHeaders(request);

     reply = manager->post(request, "");

     QObject::connect(reply, &QNetworkReply::finished, [=]() {
         if (reply->error() == QNetworkReply::NoError) {
            QByteArray responseData = reply->readAll();
            if(reply->error() == QNetworkReply::NoError){
                 QMessageBox msg;
                 QString wdrawAmount = ui->lineWdraw->text();
                 QString text = "You withdrew " + wdrawAmount;
                 msg.setText(text);
                 msg.exec();
            }
            qDebug() << "Response:" << responseData;

         } else {
            qDebug() << "Error:" << reply->errorString();
            ui->lineWdraw->clear();
         }

         reply->deleteLater();
         manager->deleteLater();
     });
}

void MainWindow::on_Withdrawhc_clicked()
{
    ui->Wotherwidget->hide();
    ui->lineWdraw->clear();
}

void MainWindow::on_btnHistoryNext_clicked()
{
    if (transactionHistory.toArray().size() < 5) {
        return;
    }
    // todo: transaction history row check for here, to block infinity loops.

    historyPageIndex++;
    MainWindow::handleTransactionViewPageData(historyPageIndex);
    ui->sivu->setText(QString::number(historyPageIndex + 1));
}


void MainWindow::on_btnHistoryPrevius_clicked()
{
    if ( historyPageIndex == 0 ) {
        return;
    }

    if ( historyPageIndex - 1 < 0 ) {
        historyPageIndex = 1;
    }

    historyPageIndex--;

    MainWindow::handleTransactionViewPageData(historyPageIndex);
    ui->sivu->setText(QString::number(historyPageIndex + 1));
}

void MainWindow::on_btnHisLogout_clicked()
{
    logOut();
    Cleareverything();
}


void MainWindow::on_btnBalLogout_clicked()
{
    logOut();
    Cleareverything();
}

