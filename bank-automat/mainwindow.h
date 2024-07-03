#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "qlabel.h"
#include <QCoreApplication>
#include <QWidget>
#include <QDebug>
#include <QStackedWidget>
#include <QMainWindow>
#include <QtNetwork>
#include <QNetworkAccessManager>
#include <QJsonDocument>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <datamodel.h>
#include <QSerialPort>
#include <QSerialPortInfo>

QT_BEGIN_NAMESPACE
namespace Ui { class MainWindow; }
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();
    void logOut();

private slots:
    void on_btnPin1_clicked();

    void on_btnPin2_clicked();

    void on_btnPin3_clicked();

    void on_btnPin4_clicked();

    void on_btnPin5_clicked();

    void on_btnPin6_clicked();

    void on_btnPin7_clicked();

    void on_btnPin8_clicked();

    void on_btnPin9_clicked();

    void on_btnPin0_clicked();

    void on_btnPinCancel_clicked();

    void on_btnPinOk_clicked();

    void on_pushButton_clicked();

    void on_p2btnLogout_clicked();

    void on_btnHomeLogout_clicked();

    void on_btnWdraw20_clicked();

    void on_btnWdraw40_clicked();

    void on_btnWdraw50_clicked();

    void on_btnWdraw100_clicked();

    void on_btnWdrawReturn_clicked();

    void on_btnWithdraw_clicked();

    void on_btnDebit_clicked();

    void on_btnCredit_clicked();

    void on_btnWdraw_clicked();

    void on_btnWdrawLogout_clicked();

    void on_btnHistory_clicked();

    void on_return_h_clicked();

    void on_log_out_clicked();

    void on_btnHomeLogout_2_clicked();

    void on_btnWdrawLogout_4_clicked();

    void on_btnWdrawReturn_4_clicked();

    void on_btnHisReturn_clicked();

    void on_btnBalance_clicked();

    void on_btnBalReturn_clicked();

    void readData();
    void on_btnWdrawother_clicked();

    void on_btnDeCreLogout_clicked();

    void on_Wdrawbtn1_clicked();

    void on_Wdrawbtn2_clicked();

    void on_Wdrawbtn3_clicked();

    void on_Wdrawbtn4_clicked();

    void on_Wdrawbtn5_clicked();

    void on_Wdrawbtn6_clicked();

    void on_Wdrawbtn7_clicked();

    void on_Wdrawbtn8_clicked();

    void on_Wdrawbtn9_clicked();

    void on_Wdrawbtn0_clicked();

    void on_Wdrawcancel_clicked();

    void on_Wdrawok_clicked();

    void on_Withdrawhc_clicked();

    void handleTransactionViewPageData(int page = 0);
    
    void on_btnHistoryNext_clicked();

    void on_btnHistoryPrevius_clicked();

    void on_btnHisLogout_clicked();

    void on_btnBalLogout_clicked();

private:
    QSerialPort *serialPort;
    Ui::MainWindow *ui;
    void Cleareverything();
    void updateWdrawText(int n);
    void updatePinText(int n);
    QByteArray response_data;
    QNetworkAccessManager *manager;
    QNetworkReply *reply;

    int historyPageIndex;
    QJsonValue transactionHistory;
    
protected:
    void SetWithdrawAmount(QString str);
    void updateTransactionData();

    void setAuthHeaders(QNetworkRequest &request);
};
#endif // MAINWINDOW_H
