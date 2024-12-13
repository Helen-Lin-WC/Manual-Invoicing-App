const { createServer } = require('http'); // Provides functionality to create an HTTP server
const { parse } = require('url'); //allows the app to parse files
const next = require('next'); //Loads the next.js framework
const express = require('express'); // Loads the Express.js framework
const nodemailer = require('nodemailer'); //provides tools to allow for sending emails in the app.
const multer = require('multer'); // Middleware for handling file uploads. allows the pp to accept files from the form
const cors = require('cors'); //Provides middleware to enable Cross-Origin Resource Sharing (CORS)
const oracledb = require('oracledb'); //loads the oracle driver for node.js which is installed in the package.json file
const crypto = require('crypto'); //allows the app to decrypt the db credentials
const dotenv = require('dotenv'); 
const path = require('path'); // Provides utilities for working with file and directory paths
const fs = require('fs'); //allows the app to read from and write to files

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

//path to the invoiceNumber.json file
const invoiceDataFile = path.join(__dirname, 'invoiceNumber.json');

// Setup Next.js
const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3001; //change this to whatever port number the app is being ran on
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();


// Initialize Express
const app = express();

app.use(cors());
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const algorithm = 'aes-256-cbc'; // algorithm used for encryption and decryption
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

// Decrypt function and DB credentials
function decrypt(text) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

let oracleUser, oraclePassword, oracleConnectString;

try {
  oracleUser = decrypt(process.env.ORACLE_DB_USER);
  oraclePassword = decrypt(process.env.ORACLE_DB_PASSWORD);
  oracleConnectString = decrypt(process.env.ORACLE_DB_CONNECTION_STRING);
} catch (error) {
  console.error('Error decrypting Oracle credentials:', error);
  process.exit(1);
}

// Add middleware to set the port number
app.use((req, res, next) => {
  const portnumber = req.headers['x-iisnode-server_port'] || 3001; // set this to whatever port the app is being ran on
  res.locals.serverport = portnumber;
  console.log(`Request received on port: ${portnumber}`);
  next();
});

//function for inserting invoice data into Invoice Table
async function insertInvoiceData(connection, invoiceRows) {
  try {
    const insertSql = `
      INSERT INTO USR_MI_INVOICE 
        (INVOICE_NO, INVOICE_DATE, VENDOR_ID, INVOICE_COMMENT) 
      VALUES 
        (:invoiceNumber, TO_DATE(:billingDate, 'YYYY-MM-DD'), :vendorId, :INVOICE_COMMENT)
      RETURNING INVOICE_ID INTO :invoiceId
    `;

    const options = {
      autoCommit: false
    };

    for (const row of invoiceRows) {
      const result = await connection.execute(
        insertSql,
        {
          invoiceNumber: row.invoiceNumber,
          billingDate: row.billingDate,
          vendorId: row.vendorId,
          INVOICE_COMMENT: row.comment,
          invoiceId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        options
      );
      row.invoiceId = result.outBinds.invoiceId[0];
      console.log('Invoice data inserted:', row.invoiceId);
    }
  } catch (error) {
    console.error('Error inserting invoice data:', error);
    throw error;
  }
}

//function for inserting vendor data into vendor table
async function insertVendorData(connection, vendorRows) {
  try {
    const selectSql = `
      SELECT VENDOR_ID FROM USR_MI_VENDOR WHERE COMPANY_NAME = :selectedCompany
    `;

    const insertSql = `
      INSERT INTO USR_MI_VENDOR 
        (COMPANY_NAME, VENDOR_NAME, ADRESS, CITY, PROVINCE, POSTAL_CODE) 
      VALUES 
        (:selectedCompany, :REInput, :streetName, :cityName, :selectedProvince, :postalCode)
      RETURNING VENDOR_ID INTO :vendorId
    `;

    const options = {
      autoCommit: false
    };

    for (const row of vendorRows) {
      let result = await connection.execute(selectSql, { selectedCompany: row.selectedCompany });
      
      if (result.rows.length > 0) {
        row.vendorId = result.rows[0][0];
      } else {
        result = await connection.execute(
          insertSql,
          {
            selectedCompany: row.selectedCompany,
            REInput: row.REInput,
            streetName: row.streetName,
            cityName: row.cityName,
            selectedProvince: row.selectedProvince,
            postalCode: row.postalCode,
            vendorId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
          },
          options
        );
        row.vendorId = result.outBinds.vendorId[0];
        console.log('Vendor data inserted:', row.vendorId);
      }
    }
  } catch (error) {
    console.error('Error inserting vendor data:', error);
    throw error;
  }
}

//function for inserting item data into item table
async function insertItemData(connection, itemRows) {
  try {
    const selectSql = `
      SELECT ITEM_ID FROM USR_MI_ITEM WHERE ITEM_TYPE = :item AND ITEM_DESCRIPTION = :description
    `;

    const insertSql = `
      INSERT INTO USR_MI_ITEM 
        (ITEM_TYPE, ITEM_DESCRIPTION, SALE_UNIT_PRICE) 
      VALUES 
        (:item, :description, :unitPrice)
      RETURNING ITEM_ID INTO :itemId
    `;

    const options = {
      autoCommit: false
    };

    for (const row of itemRows) {
      let result = await connection.execute(selectSql, { item: row.item, description: row.description });
      
      if (result.rows.length > 0) {
        row.itemId = result.rows[0][0];
      } else {
        result = await connection.execute(
          insertSql,
          {
            item: row.item,
            description: row.description,
            unitPrice: row.unitPrice,
            itemId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
          },
          options
        );
        row.itemId = result.outBinds.itemId[0];
        console.log('Item data inserted:', row.itemId);
      }
    }
  } catch (error) {
    console.error('Error inserting item data:', error);
    throw error;
  }
}

//function for inserting invoiceItem data into invoice_item table
async function insertInvoiceItemData(connection, invoiceItemRows) {
  try {
    const sql = `
      INSERT INTO USR_MI_INVOICE_ITEM 
        (INVOICE_ID, ITEM_ID, QUANTITY, INVOICE_AMT, COST_CENTRE, CODING) 
      VALUES 
        (:invoiceId, :itemId, :quantity, :totalDue, :cc, :coding)
    `;

    const bindsArray = invoiceItemRows.map(row => ({
      invoiceId: row.invoiceId,
      itemId: row.itemId,
      quantity: row.quantity,
      totalDue: row.totalDue,
      cc: row.cc,
      coding: row.coding
    }));

    const options = {
      autoCommit: false
    };

    console.log('Invoice item data to be inserted:', bindsArray);

    const result = await connection.executeMany(sql, bindsArray, options);

    console.log('Rows inserted into USR_MI_INVOICE_ITEM:', result.rowsAffected);
  } catch (error) {
    console.error('Error inserting invoice item data:', error);
    throw error;
  }
}

// function for fecthing company names for company field dropdown options
async function getCompanyNames() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });

    const result = await connection.execute(
      `SELECT COMPANY_NAME FROM USR_MI_VENDOR`
    );

    return result.rows.map(row => ({ COMPANY_NAME: row[0] }));
  } catch (error) {
    console.error('Error fetching company names:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed.');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

// Initialize or load data from the file
let invoiceData = {
  sequentialNumber: 1,
  invoiceMonth: new Date().getMonth() + 1,
};

if (fs.existsSync(invoiceDataFile)) {
  const data = fs.readFileSync(invoiceDataFile, 'utf8');
  invoiceData = JSON.parse(data);
}

// Generate and store invoice number
app.get('/api/generate-invoice-number', (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Reset sequential number if the month has changed
  if (invoiceData.invoiceMonth !== currentMonth) {
    invoiceData.sequentialNumber = 1;
    invoiceData.invoiceMonth = currentMonth;
  }

  //formats the invoice number
  const formattedSequentialNumber = invoiceData.sequentialNumber.toString().padStart(3, '0');
  const invoiceNumber = `${year}${currentMonth.toString().padStart(2, '0')}${formattedSequentialNumber}`;
  
  res.json({ invoiceNumber });
});

//api endpoint for fecthing related information for company name
app.get('/api/companyDetails', async (req, res) => {
  const { companyName } = req.query;
  if (!companyName) {
    return res.status(400).json({ message: 'Company name is required' });
  }
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });
    const result = await connection.execute(
      `SELECT ADRESS, CITY, PROVINCE, POSTAL_CODE, VENDOR_NAME FROM USR_MI_VENDOR WHERE COMPANY_NAME = :companyName`,
      { companyName }
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    const [address, city, province, postalCode, RE] = result.rows[0];
    res.status(200).json({ address, city, province, postalCode, RE });
  } catch (error) {
    console.error('Error fetching company details:', error);
    res.status(500).json({ message: 'Failed to fetch company details' });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed.');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
});

//api enpoint for pulling item descriptions from the database
app.get('/api/itemDescriptions', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });
    const result = await connection.execute(
      `SELECT ITEM_DESCRIPTION FROM USR_MI_ITEM`
    );
    const itemDescription = result.rows.map(row => row[0]);
    res.status(200).json(itemDescription);
  } catch (error) {
    console.error('Error fetching item types:', error);
    res.status(500).json({ message: 'Failed to fetch item description' });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed.');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
});

//endpoint to pull item details from the database
app.get('/api/itemDetails', async (req, res) => {
  const { itemDescription } = req.query;
  if (!itemDescription) {
    return res.status(400).json({ message: 'Item description is required' });
  }
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });
    const result = await connection.execute(
      `SELECT ITEM_TYPE, SALE_UNIT_PRICE FROM USR_MI_ITEM WHERE ITEM_DESCRIPTION = :itemDescription`,
      { itemDescription }
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    const [itemType, saleUnitPrice] = result.rows[0];
    res.status(200).json({ itemType, saleUnitPrice });
  } catch (error) {
    console.error('Error fetching item details:', error);
    res.status(500).json({ message: 'Failed to fetch item details' });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed.');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
});

//api endpoint for functionlity to send invoice
app.post('/api/sendInvoice', upload.single('pdf'), async (req, res) => {

  const invoiceNumber = req.body.invoiceNumber; // Retrieved from the client
  const uniqueFileName = `invoice_${invoiceNumber}.pdf`

  //function for sending email
  const transporter = nodemailer.createTransport({
    host: 'mail.wcap.ca',
    port: 25,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  //content to be sent in the email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'yafiet.haile@wcap.ca',
    subject: 'Invoice',
    text: 'Please find the attached invoice.',
    attachments: [
      {
        filename: uniqueFileName,
        content: req.file.buffer
      }
    ]
  };
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });
    const rows = JSON.parse(req.body.rows);
    const vendorRows = [
      {
        selectedCompany: req.body.selectedCompany,
        REInput: req.body.REInput,
        streetName: req.body.streetName,
        cityName: req.body.cityName,
        selectedProvince: req.body.selectedProvince,
        postalCode: req.body.postalCode
      }
    ];
    const itemRows = rows.map(row => ({
      item: row.item,
      description: row.description,
      unitPrice: row.unitPrice
    }));
    await insertVendorData(connection, vendorRows);
    const vendorId = vendorRows[0].vendorId;
    await insertItemData(connection, itemRows);
    const invoiceRows = rows.map(row => ({
      invoiceNumber: req.body.invoiceNumber,
      billingDate: req.body.billingDate,
      vendorId: vendorId,
      comment: req.body.comment
    }));
    console.log('Invoice rows to be inserted:', invoiceRows);
    await insertInvoiceData(connection, invoiceRows);
    const invoiceId = invoiceRows[0].invoiceId;
    const invoiceItemRows = rows.map(row => ({
      invoiceNumber: req.body.invoiceNumber,
      itemId: itemRows.find(itemRow => itemRow.item === row.item && itemRow.description === row.description).itemId,
      quantity: row.quantity,
      totalDue: row.totalDue,
      cc: row.cc,
      coding: row.coding,
      invoiceId: invoiceId
    }));

    await insertInvoiceItemData(connection, invoiceItemRows);
    await connection.commit();
    console.log('Transaction committed.');
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.status(200).json({ message: 'Invoice sent successfully and saved to database' });
    invoiceData.sequentialNumber += 1; // Increment and save the sequential number
    fs.writeFileSync(invoiceDataFile, JSON.stringify(invoiceData), 'utf8'); //writes the newly incremented invoiceNumber to the json file

  } catch (error) {
    console.error('Error sending invoice or saving data:', error);
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back.');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    res.status(500).json({ message: 'Failed to send invoice' });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed.');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
});

//api enpoint to pull company names from the database
app.get('/api/companyNames', async (req, res) => {
  try {
    const companyNames = await getCompanyNames();
    res.status(200).json(companyNames);
  } catch (error) {
    console.error('Error fetching company names:', error);
    res.status(500).json({ message: 'Failed to fetch company names' });
  }
});



//api endpoint to pull invoices for editInvoice page
app.get('/api/viewInvoices', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });

    const result = await connection.execute(
      `SELECT INVOICE_ID, INVOICE_NO, TO_CHAR(INVOICE_DATE, 'YYYY-MM-DD') AS INVOICE_DATE, VENDOR_NAME, COMPANY_NAME, ADRESS, CITY, PROVINCE, POSTAL_CODE, INVOICE_COMMENT, INVOICE_PAID FROM USR_MI_INVOICE_VW`
    );

    const itemResult = await connection.execute(
      `SELECT 
        INVOICE_ID, INVOICE_NO, VENDOR_NAME, ITEM_DESCRIPTION, ITEM_ID, ITEM_TYPE, SALE_UNIT_PRICE, QUANTITY
      FROM USR_MI_INVOICE_ITEM_VW`
    );


    const itemMap = itemResult.rows.reduce((acc, item) => {
      const [INVOICE_ID, INVOICE_NO, VENDOR_NAME, ITEM_DESCRIPTION, ITEM_ID, ITEM_TYPE, SALE_UNIT_PRICE, QUANTITY] = item;
      if (!acc[INVOICE_ID]) {
        acc[INVOICE_ID] = [];
      }
      acc[INVOICE_ID].push({
        INVOICE_NO,
        VENDOR_NAME,
        ITEM_DESCRIPTION,
        ITEM_ID,
        ITEM_TYPE,
        SALE_UNIT_PRICE,
        QUANTITY,
      });
      return acc;
    }, {});

    const invoices = result.rows.map(row => {
      const [INVOICE_ID, INVOICE_NO, INVOICE_DATE, VENDOR_NAME, COMPANY_NAME, ADRESS, CITY, PROVINCE, POSTAL_CODE, INVOICE_COMMENT, INVOICE_PAID] = row;
      return {
        INVOICE_ID,
        INVOICE_NO,
        INVOICE_DATE,
        VENDOR_NAME,
        COMPANY_NAME,
        ADDRESS: ADRESS,
        CITY,
        PROVINCE,
        POSTAL_CODE,
        INVOICE_COMMENT,
        INVOICE_PAID,
        ITEMS: itemMap[INVOICE_ID] || []
      };
    });

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed.');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
});

//api endpoint for updating invoices
app.put('/api/updateInvoice/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  const invoiceData = req.body;

  console.log('Received request to update invoice:', invoiceId, invoiceData);

  let connection;
  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });

    console.log('Database connection established');

    // Update invoice details
    const updateInvoiceQuery = `
      UPDATE USR_MI_INVOICE
      SET INVOICE_NO = :invoiceNo,
          INVOICE_DATE = TO_DATE(:invoiceDate, 'YYYY-MM-DD'),
          INVOICE_PAID = :invoicePaid
      WHERE INVOICE_ID = :invoiceId
    `;
    console.log('Executing updateInvoiceQuery');
    await connection.execute(updateInvoiceQuery, {
      invoiceNo: invoiceData.INVOICE_NO,
      invoiceDate: invoiceData.INVOICE_DATE,
      invoicePaid: invoiceData.INVOICE_PAID,
      invoiceId: parseInt(invoiceId)
    });
    console.log('Updated invoice:', invoiceId);

    // Update items data
    for (const item of invoiceData.ITEMS) {
      const updateItemQuery = `
        UPDATE USR_MI_ITEM
        SET ITEM_DESCRIPTION = :itemDescription,
            ITEM_TYPE = :itemType,
            SALE_UNIT_PRICE = :saleUnitPrice
        WHERE ITEM_ID = :itemId
      `;
      console.log('Executing updateItemQuery for item:', item.ITEM_ID);
      await connection.execute(updateItemQuery, {
        itemDescription: item.ITEM_DESCRIPTION,
        itemType: item.ITEM_TYPE,
        saleUnitPrice: item.SALE_UNIT_PRICE,
        itemId: item.ITEM_ID
      });
      console.log('Updated item:', item.ITEM_ID);
    }

    // Update invoice items data
    for (const item of invoiceData.ITEMS) {
      const updateItemQuery = `
        UPDATE USR_MI_INVOICE_ITEM
        SET QUANTITY = :quantity
        WHERE ITEM_ID = :itemId AND INVOICE_ID = :invoiceId
      `;
      console.log('Executing updateItemQuery for invoice item:', item.ITEM_ID);
      await connection.execute(updateItemQuery, {
        quantity: item.QUANTITY,
        itemId: item.ITEM_ID,
        invoiceId: parseInt(invoiceId)
      });
      console.log('Updated invoice item:', item.ITEM_ID);
    }

  // Get the VENDOR_ID from the invoice
  const getVendorIdQuery = `
    SELECT VENDOR_ID
    FROM USR_MI_INVOICE
    WHERE INVOICE_ID = :invoiceId
  `;
  console.log('Executing getVendorIdQuery');
  const vendorIdResult = await connection.execute(getVendorIdQuery, { invoiceId: parseInt(invoiceId) });

  const vendorId = vendorIdResult.rows[0] ? vendorIdResult.rows[0][0] : null; // Correctly access the VENDOR_ID

  if (vendorId) {
    console.log('Found Vendor ID:', vendorId);

    const updateVendorQuery = `
      UPDATE USR_MI_VENDOR
      SET VENDOR_NAME = :vendorName,
          COMPANY_NAME = :companyName,
          ADRESS = :address,
          CITY = :city,
          POSTAL_CODE = :postalCode,
          PROVINCE = :province
      WHERE VENDOR_ID = :vendorId
    `;
    console.log('Executing updateVendorQuery for vendor:', vendorId);
    await connection.execute(updateVendorQuery, {
      vendorName: invoiceData.VENDOR_NAME,
      companyName: invoiceData.COMPANY_NAME,
      address: invoiceData.ADDRESS,
      city: invoiceData.CITY,
      postalCode: invoiceData.POSTAL_CODE,
      province: invoiceData.PROVINCE,
      vendorId: vendorId
    });
    console.log('Updated vendor:', vendorId);
  } else {
    console.error('Vendor ID not found for invoice:', invoiceId);
  }


    // Commit the transaction
    console.log('Committing transaction');
    await connection.commit();
    console.log('Transaction committed successfully');

    res.json({ message: 'Invoice updated successfully' });
  } catch (err) {
    console.error('Error updating invoice:', err);
    res.status(500).json({ error: 'Error updating invoice', details: err.message });
  } finally {
    if (connection) {
      try {
        console.log('Closing database connection');
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

//api enpoint for updating the payment status of an invoice
app.put('/api/updateInvoicePayment/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  const invoiceData = req.body;

  console.log('Received request to update invoice:', invoiceId, invoiceData);

  let connection;
  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });

    console.log('Database connection established');

    // Update invoice details
    const updateInvoiceQuery = `
      UPDATE USR_MI_INVOICE
      SET INVOICE_PAID = :invoicePaid
      WHERE INVOICE_ID = :invoiceId
    `;
    console.log('Executing updateInvoiceQuery');
    await connection.execute(updateInvoiceQuery, {
      invoicePaid: invoiceData.INVOICE_PAID,
      invoiceId: parseInt(invoiceId),
    });
    console.log('Updated payment for Invoice:', invoiceId);
    
    // Commit the transaction
    console.log('Committing transaction');
    await connection.commit();
    console.log('Transaction committed successfully');
    
    // Respond with success
    res.status(200).json({ success: true, message: 'Invoice payment updated successfully' });
  } catch (err) {
    console.error('Error updating invoice payment:', err);
    res.status(500).json({ success: false, error: 'Error updating invoice payment', details: err.message });
  } finally {
    if (connection) {
      try {
        console.log('Closing database connection');
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
        // If there's an error closing the connection, this should not result in a false success message
      }
    }
  }
});

//api enpoint for deleting an invoice
app.delete('/api/deleteInvoice/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;

  let connection;
  try {
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString,
    });

    // Delete from USR_MI_INVOICE_ITEM
    await connection.execute(`
      DELETE FROM USR_MI_INVOICE_ITEM
      WHERE INVOICE_ID = :invoiceId
    `, { invoiceId: parseInt(invoiceId) });

    // Delete from USR_MI_INVOICE
    await connection.execute(`
      DELETE FROM USR_MI_INVOICE
      WHERE INVOICE_ID = :invoiceId
    `, { invoiceId: parseInt(invoiceId) });

    await connection.commit();

    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('Error deleting invoice:', err);
    res.status(500).json({ error: 'Error deleting invoice', details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

// Handle Next.js requests
app.all('*', (req, res) => {
  const parsedUrl = parse(req.url, true);
  const { pathname, query } = parsedUrl;

  if (pathname === '/a') {
    nextApp.render(req, res, '/a', query);
  } else if (pathname === '/b') {
    nextApp.render(req, res, '/b', query);
  } else {
    handle(req, res, parsedUrl);
  }
});

// Initialize Next.js and start server
nextApp.prepare().then(() => {
  // Use the port from the middleware or default to 3000
  const port = app.locals.serverport || process.env.PORT || 3001; //change this to whatever port the app is running on
  createServer(app).listen(port, (err) => {
    if (err) {
      console.error('Error starting server:', err);
      throw err;
    }
    console.log(`> Ready on http://localhost:${port}`);
  });
});
