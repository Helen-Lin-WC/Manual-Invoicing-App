# Manual Invoicing 

## Overview
This is a manual invoicing web application built using Next.js for the frontend, with a Node.js/Express.js backend and an Oracle Database.
This app allows users to create new invoices with an admin portal for viewing, editing and deleting invoices.  Newly created invoice data is saved to a pdf file 
and sent through email.

## Table of contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- Create, edit, and delete invoices.
- Fetch and display vendor and item details.
- Admin portal for invoice management.
- Automatic tax calculation (GST, PST).
- Export invoices as PDFs and send via email.

## Technologies used

- **Frontend**: Next.js, React, CSS
- **Backend**: Node.js, Express.js, Oracle Database
- **Database**: Oracle Database
- **Authentication**: Microsoft AD/SSO
- **Emailing**: Nodemailer
- **Server**: IIS

## Installation

Before starting this process, ensure that you are able to run scripts in the terminal/command line.  This is needed to install packages required for this project.
To do this, open Windows Powershell and run the following command "Set-ExecutionPolicy RemoteSigned".  (This settting is so that only locally created scripts can be ran on the machine)  
For more information : https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy?view=powershell-7.4

- Install and IDE of your choice, ideally Visual Studio Code.
- Install Node.js: https://nodejs.org/en/download
- Install npm (run "npm install" in the command line or in the terminal of the Vs Code IDE) Run "npm --version" command afterwards to ensure that npm is successfully installed on your system.
- Install express(npm install express)
- Re-install all dependancies listed in the package.json file

NOTE: After installing these, check the "package.json" file and ensure that the latest version of these technologies have been installed.


## Usage

- **Development mode**: "npm run dev" rund the application in development mode.  Ensure all the api calls and port configuration in the server file are set to run on the localhost
server when running in development mode.

- **Production mode**: "npm run build", "npm start" the first command builds the application, and the second runs it in production mode.

- **IIS server**: before moving an updated version of the project on the IIS server, ensure that the ports on the server.js file are configured to the port in which the IIS server
runs on.  Also ensure that the api calls are set to listen for the IIS server

## Deployment

### Deploying on IIS

- Copy the project folder to the IIS Server
- Configure the IIS server to point to the project's directory
- Ensure that 'iisnode' is properly set up to handle Node.js applications

## Troubleshooting

**Database Connection**: Ensure that the Oracle Database connection string, username and password are correct and that the database is running
**Environment Variable**: Double-check your '.env' file to endure all variables are correctly set and that the server.js is properly loading and reading them.
**IIS Deployment Issues**: Ensure that the 'iisnode' folder is created when copying the project folder to the server.  Also ensure that the configuration file is in the root folder for the project.

## Contributing 

If you would like to contribute to this project, please follow these steps:

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Push to the new branch
5. Open a pull request.
