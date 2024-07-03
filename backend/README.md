<img src="https://www.oamk.fi/images/Logot/Suomi-www-sahkoinen-png-rgb/www_sivut_ja_sahkoiset_esitykset_suomeksi_varillinen-02.png" align="center" />

# School ATM api

This repository contains the backend code for an ATM system built using Azure Functions with Node.js and TypeScript.

## Overview

This backend system provides the necessary functionalities for an ATM, including:

- Authentication and authorization for users.
- Authentication and authorization for RFID + pincode.
- Retrieval of account information.
- Withdrawal operations.
- Transaction history tracking.

## Prerequisites

Before running this backend system, ensure you have the following installed:

- Node.js and npm: [Download and install Node.js](https://nodejs.org/).
- Azure Functions Core Tools: Install using npm with `npm install -g azure-functions-core-tools`.

## Installation

1. Clone this repository to your local machine:
```bash
git clone https://github.com/Aik-10/school_bank_api
cd school_bank_api
```
2. Install dependencies:
```bash
pnpm i
```

## Configuration

Before running the application, you need to set up the necessary configuration variables. edit a local.settings.json file in the root directory of the project and define the following variables:
```
API_JWT_TOKEN: ""
DB_AUTH: ""
```

## Endpoints
Here are the available endpoints provided by this backend:

- `/auth/login`: This endpoint is for user authentication, allowing users to log in to the system.

- `/auth/register`: This endpoint is for user registration, enabling new users to create accounts in the system.

- `/auth/cards`: This endpoint is for checking if a card is valid. It likely involves verifying the card number against a database of valid cards.

- `/auth/cards/validate`: This endpoint is for authenticating a card, typically involving additional security measures such as PIN validation.

- `/user`: This endpoint provides user information, possibly including details such as name, contact information, etc.

- `/user/card/{id}/{action?}`: This endpoint deals with card-related actions, where {id} represents the card identifier. The optional {action} parameter could include actions like blocking a card, updating card details, etc.

- `/user/accounts/{id}/action/{action}`: This endpoint handles actions related to user accounts, where {id} represents the account identifier. The {action} parameter likely includes actions such as balance inquiry, withdrawal, deposit, etc.