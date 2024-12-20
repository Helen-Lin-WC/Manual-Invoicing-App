"use client" // tells react this page should be rendered on the client side
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@nextui-org/react"; //provides tools for creating dropdown menus
import { Autocomplete, TextField } from '@mui/material' //provides tools for autofilling input fields
import generateInvoicePDF from './invoicePdfGenerator'; //imports function for generating the invoice pdf
import Header from "../components/Header";

//hooks for form functionality
const Invoices = () => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [streetName, setStreetName] = useState('');
  const [cityName, setCityName] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [REInput, setREInput] = useState('');
  const [billingDate, setBillingDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [rows, setRows] = useState([{ quantity: '', item: '', description: '', cc: '', coding: '', unitPrice: '' }]);
  const [comment, setComment] = useState('');
  const [PST, setPST] = useState(0);
  const [errors, setErrors] = useState({}); // Define errors
  const [showErrorMessage, setShowErrorMessage] = useState(false); // State to track if error message should be shown
  const [companyOptions, setCompanyOptions] = useState([]); // State to store company names
  const [itemDescriptions, setItemDescriptions] = useState([]);


// pst values for provinces
  const provinces = [
    { name: 'Alberta', pst: 0 },
    { name: 'British Columbia', pst: 0.07 },
    { name: 'Manitoba', pst: 0.07 },
    { name: 'New Brunswick', pst: 0.1 },
    { name: 'Newfoundland and Labrador', pst: 0.1 },
    { name: 'Northwest Territories', pst: 0 },
    { name: 'Nova Scotia', pst: 0.1 },
    { name: 'Nunavut', pst: 0 },
    { name: 'Ontario', pst: 0.08 },
    { name: 'Prince Edward Island', pst: 0.1 },
    { name: 'Quebec', pst: 0.09975 },
    { name: 'Saskatchewan', pst: 0.06 },
    { name: 'Yukon', pst: 0 }
  ];

  //value for billing date
  useEffect(() => {
    const currentDate = new Date().toISOString().slice(0, 10);
    setBillingDate(currentDate);
  }, []);

  useEffect(() => {
    // Fetch the invoice number from the server when the component loads
    fetch('http://localhost:3001/api/generate-invoice-number')
      .then((response) => response.json())
      .then((data) => {
        setInvoiceNumber(data.invoiceNumber);
      })
      .catch((error) => {
        console.error('Error fetching invoice number:', error);
      });
  }, []);

  
  

  useEffect(() => {
    fetchCompanyNames();
  }, []);

  //api call for the company names saved in the database
  const fetchCompanyNames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/companyNames');
      setCompanyOptions(response.data);
    } catch (error) {
      console.error('Error fetching company names:', error);
    }
  };

  //api call for fetching the company details from the server.js file
  const fetchCompanyDetails = async (companyName) => {
    try {
      const response = await axios.get('http://localhost:3001/api/companyDetails', { params: { companyName } });
      return response.data;
    } catch (error) {
      console.error('Error fetching company details:', error);
      return {};
    }
  };

  useEffect(() => {
    //api call for fecthing item decriptions from the server.js file
    const fetchItemDescriptions = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/itemDescriptions');
        const itemDescriptionsData = await response.json();
        setItemDescriptions(itemDescriptionsData); // Set the item descriptions
      } catch (error) {
        console.error('Error fetching item types:', error);
      }
    };
  
    fetchItemDescriptions();
  }, []);
  

  //functionalty for item description field
  const handleItemDescriptionChange = async (event, index) => {
    const selectedItemDescription = event.target.value;
  
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      updatedRows[index].description = selectedItemDescription;
  
      // Clear item and unitPrice if description is cleared
      if (!selectedItemDescription) {
        updatedRows[index].item = '';
        updatedRows[index].unitPrice = '';
        return updatedRows;
      }
  
      return updatedRows;
    });
  
    if (!selectedItemDescription) {
      return; // If the description is cleared, don't fetch item details
    }
  
    try {
      const response = await fetch(`http://localhost:3001/api/itemDetails?itemDescription=${selectedItemDescription}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const itemDetails = await response.json();
  
      setRows(prevRows => {
        const updatedRows = [...prevRows];
        updatedRows[index].item = itemDetails.itemType;
        updatedRows[index].unitPrice = itemDetails.saleUnitPrice;
        return updatedRows;
      });
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };
  
  
  //function for handling company input field changes
  const handleCompanyChange = async (event, newValue) => {
    if (typeof newValue === 'string') {
      setSelectedCompany(newValue);
    } else if (newValue && newValue.inputValue) {
      setSelectedCompany(newValue.inputValue);
    } else {
      setSelectedCompany(newValue?.COMPANY_NAME || '');
    }
  
    if (!newValue || !newValue.COMPANY_NAME) {
      // Clear the fields if no valid company is selected
      setStreetName('');
      setCityName('');
      setSelectedProvince('');
      setPostalCode('');
      setREInput('');
      return;
    }
  
    try {
      const companyDetails = await fetchCompanyDetails(newValue.COMPANY_NAME);
      //sets street name, city, postal code and vendor name to the assciated company information
      setStreetName(companyDetails.address || '');
      setCityName(companyDetails.city || '');
      setSelectedProvince(companyDetails.province || '');
      setPostalCode(companyDetails.postalCode || '');
      setREInput(companyDetails.RE || '');
    } catch (error) {
      console.error('Error fetching company details:', error);
      // clear the fields if there's an error fetching details
      setStreetName('');
      setCityName('');
      setSelectedProvince('');
      setPostalCode('');
      setREInput('');
    }
  };
  
  

  const handleCompanyInputChange = (event, newInputValue) => {
    setSelectedCompany(newInputValue);
  };

  
  const handleRowChange = (index, key, value) => {
    const newRows = [...rows];
    newRows[index][key] = key === 'unitPrice' && value < 0 ? 0 : value;
    setRows(newRows);
  };

  //function for adding new rows to the data entry table
  const addRow = () => {
    setRows([...rows, { quantity: '', item: '', description: '', cc: '', coding: '', unitPrice: '' }]);
  };

  //function for removing rows from the data entry table
  const removeRow = (index) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, rowIndex) => rowIndex !== index);
      setRows(newRows);
    }
  };

  //calulates the subtotal
  const calculateSubtotal = () => {
    return rows.reduce((total, row) => total + (row.quantity * row.unitPrice), 0).toFixed(2);
  };

  //caluculates gst
  const calculateGST = (subtotal) => {
    return (subtotal * 0.05).toFixed(2);
  };

  //calculates pst
  const calculatePST = (subtotal) => {
    return (subtotal * PST).toFixed(2);
  };

  //calculates the total amount
  const calculateTotalDue = (subtotal, GST, PSTAmount) => {
    return (parseFloat(subtotal) + parseFloat(GST) + parseFloat(PSTAmount)).toFixed(2);
  };

  const subtotal = parseFloat(calculateSubtotal());
  const GST = calculateGST(subtotal);
  const PSTAmount = calculatePST(subtotal);
  const totalDue = calculateTotalDue(subtotal, GST, PSTAmount);

  //handles the PST change based on the province selected
  const handleProvinceChange = (selectedProvince) => {
    setSelectedProvince(selectedProvince);
    const province = provinces.find(p => p.name === selectedProvince);
    setPST(province ? province.pst : 0);
  };

  //function for handling error messages when input fields are left empty
  const validateFields = () => {
    const newErrors = {};

    if (!selectedCompany) newErrors.selectedCompany = 'Company name is required';
    if (!streetName) newErrors.streetName = 'Street name is required';
    if (!cityName) newErrors.cityName = 'City name is required';
    if (!selectedProvince) newErrors.selectedProvince = 'Province is required';
    if (!postalCode) newErrors.postalCode = 'Postal code is required';
    if (!REInput) newErrors.REInput = 'Vendor Name is required';
    if (rows.some(row => !row.quantity || !row.item || !row.unitPrice || !row.description  || !row.coding || !row.cc)) newErrors.rows = 'All rows must have quantity, item, and unit price, description, coding, and Cost Centre';

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  //functionality on accept
  const handleSendInvoice = async () => {
    const confirmation = window.confirm("A copy of this form will be sent to generalbanking@wcap.ca. Click Ok to send.");
    if (!confirmation) return;

    //checks if any required fields are left empty
    if (!validateFields()) {
      setShowErrorMessage(true);
      return;
    }

    setShowErrorMessage(false);

    try {
      const pdfBlob = generateInvoicePDF({
        invoiceNumber,
        billingDate,
        selectedCompany,
        streetName,
        cityName,
        selectedProvince,
        postalCode,
        REInput,
        rows,
        subtotal,
        GST,
        PST,
        PSTAmount,
        totalDue,
        comment
      });

      //appends all data to be sent to the server.js file
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'invoice.pdf');
      formData.append('selectedCompany', selectedCompany);
      formData.append('streetName', streetName);
      formData.append('cityName', cityName);
      formData.append('selectedProvince', selectedProvince);
      formData.append('postalCode', postalCode);
      formData.append('REInput', REInput);
      formData.append('invoiceNumber', invoiceNumber);
      formData.append('billingDate', billingDate);
      formData.append('unitPrice', rows.map(row => row.unitPrice));
      formData.append('quantity', rows.map(row => row.quantity));
      formData.append('totalDue', rows.map(row => row.totalDue));
      formData.append('costCentre', rows.map(row => row.cc));
      formData.append('coding', rows.map(row => row.coding));
      formData.append('item', rows.map(row => row.item));
      formData.append('description', rows.map(row => row.description));
      formData.append('comment', comment);
      formData.append('rows', JSON.stringify(rows));

      const response = await axios.post('http://localhost:3001/api/sendInvoice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

    if (response.status === 200) {
      alert('Invoice sent successfully!');
      //clears all input fields when an invoice is successfully sent
      setSelectedCompany('');
      setStreetName('');
      setCityName('');
      setSelectedProvince('');
      setPostalCode('');
      setREInput('');
      setRows([{ quantity: '', item: '', description: '', cc: '', coding: '', unitPrice: '' }]);
      setComment('');
      window.location.href = '/invoice'; // Refreshes the page after invoice is successfully created
   
      } else {
        console.error('Unexpected response:', response);
        alert('Failed to send invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send invoice. Please try again.');
    }
  }
  

    
  return (

        <div className="flex flex-col max-w-6xl mx-auto px-4 py-6 m-2 bg-white">

        {/* Logo and Address Section */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex flex-col space-y-1">
            <Image src="/assets/wcaplogo.png" alt="Whitecap Logo" width={200} height={200} className="mb-2"/>
            <h3 className="text-sm font-semibold">Suite 3800, 525 - 8th Avenue SW</h3>
            <h3 className="text-sm font-semibold">Calgary, AB T2P 1G1</h3>
            <h3 className="text-sm font-semibold">TEL: 266-0767</h3>
            <h3 className="text-sm font-semibold">FAX: 266-6975</h3>
          </div>

        {/* Billing Date and Invoice Number */}
          <div className="flex flex-col justify-start items-end gap-2">
            <div className="w-48">
              <div className="bg-custom-blue p-2 text-center">Billing Date</div>
              <div className="bg-white border border-t-black p-2 text-center">{billingDate}</div>
            </div>
            <div className="w-48">
              <div className="bg-custom-blue p-2 text-center">Invoice #</div>
              <div className="bg-white border border-t-black p-2 text-center min-h-[40px]">{invoiceNumber}</div>
            </div>
          </div>
        </div>
       

        {/* Company details section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
           {/* Company field */}
           <div className="col-span-full md:col-span-2">
                  <Autocomplete
                    options={companyOptions}
                    getOptionLabel={(option) => option.COMPANY_NAME || ''}
                    value={{COMPANY_NAME: selectedCompany}}
                    freeSolo
                    onChange={handleCompanyChange}
                    onInputChange={handleCompanyInputChange}
                    renderInput={(params) => (
                      <TextField {...params} label="Company" variant="outlined" error={Boolean(errors.selectedCompany)}/>
                )}
                  className="bg-white"
                />
                {errors.selectedCompany && <p className="text-red-500 text-sm">{errors.selectedCompany}</p>}
              </div>

          {/*Street name input field */}
          <div className="space-y-2">
            <input
              id="street-input"
              value={streetName}
              onChange={(e) => setStreetName(e.target.value)}
              className={`p-2 border border-black ${errors.streetName ? 'border-red-500' : ''}`}
              placeholder="Street Name"
            />
            {errors.streetName && <span className="text-red-500 text-xs">{errors.streetName}</span>}
          </div>

          {/*City input field */}
          <div className="space-y-2">
            <input
              id="city-input"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className={`p-2 border border-black ${errors.cityName ? 'border-red-500' : ''}`}
              placeholder="City"
            />
            {errors.cityName && <span className="text-red-500 text-xs">{errors.cityName}</span>}
          </div>
          
          {/*Province selection dropdown menu */}
          <div className="space-y-2">
          <label htmlFor="province-dropdown" className="font-semibold">Province:</label>
            <Dropdown>
              <DropdownTrigger>
                <Button auto flat color="primary" disableRipple className="p-2 border border-gray-300 rounded bg-white hover:bg-gray-300 m-2">
                  {selectedProvince || "Select Province"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Provinces"
                onAction={handleProvinceChange}
                selectedKeys={selectedProvince}
                className="border border-gray-300 rounded-xl bg-white"
              >
                {provinces.map((province) => (
                  <DropdownItem key={province.name} className="bg-white hover:bg-gray-100 rounded-sm">{province.name}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            {errors.selectedProvince && <span className="text-red-500 text-xs">{errors.selectedProvince}</span>}
          </div>

          {/*Postal code input field */}
          <div className="space-y-2">
            <input
              id="postal-code-input"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className={`p-2 border border-black ${errors.postalCode ? 'border-red-500' : ''}`}
              placeholder="Postal Code"
            />
            {errors.postalCode && <span className="text-red-500 text-xs">{errors.postalCode}</span>}
          </div>
         
          {/* Vendor name input field */}
          <div className="space-y-2">
            <label htmlFor="RE-input" className="font-semibold"></label>
            <input
              id="RE-input"
              value={REInput}
              onChange={(e) => setREInput(e.target.value)}
              className={`p-2 border border-black ${errors.REInput ? 'border-red-500' : ''}`}
              placeholder="RE"
            />
            {errors.REInput && <span className="text-red-500 text-xs">{errors.REInput}</span>}
          </div>-
        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-custom-blue">
              <tr>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">CC</th>
                <th className="p-2 border">Coding</th>
                <th className="p-2 border">Unit Price ($)</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="py-2 px-8 border-b">
                    <input
                      type="text"
                      value={row.quantity}
                      onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                      className={`w-full p-2 border border-black rounded ${errors.rows ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="py-2 px-8 border-b">
                    <input                    
                      value={row.item}
                      onChange={(e) => handleRowChange(index, 'item', e.target.value)}
                      className={`w-full p-2 border border-black rounded ${errors.rows ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="py-2 px-8 border-b">
                    <input
                     list={`item-descriptions-${index}`}
                      type="text"
                      value={row.description}
                      onChange={(e) => handleItemDescriptionChange(e, index)}
                      className="w-full p-2 border border-black rounded"
                    />
                    <datalist id={`item-descriptions-${index}`}>
                      {itemDescriptions.map((description, idx) => (
                        <option key={idx} value={description} />
                      ))}
                    </datalist>
                  </td>
                  <td className="py-2 px-8 border-b">
                    <input
                      type="text"
                      value={row.cc}
                      onChange={(e) => handleRowChange(index, 'cc', e.target.value)}
                      className={`w-full p-2 border border-black rounded ${errors.rows ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="py-2 px-8 border-b">
                    <input
                      type="text"
                      value={row.coding}
                      onChange={(e) => handleRowChange(index, 'coding', e.target.value)}
                      className={`w-full p-2 border border-black rounded ${errors.rows ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="py-2 px-8 border-b">
                    <input
                      type="number"
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(e) => handleRowChange(index, 'unitPrice', e.target.value)}
                      className={`w-full p-2 border border-black rounded ${errors.rows ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="py-2 px-8 border-b">
                    ${(row.quantity * row.unitPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => removeRow(index)}
                      className={`px-4 py-2 rounded ${rows.length <= 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-700'}`}
                      disabled={rows.length <= 1}

                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* End of Invoice Table */}

          {/* Add row button */}
          <button onClick={addRow} className="mt-10 p-2 bg-custom-blue border-custom-blue border-2 rounded mx-auto block font-semibold hover:bg-custom-hover-blue hover:text-white">Add Row</button>
        </div>

        {/* Divider */}
        <div className="mt-20 my-6 border-t-2 border-black"></div>

        {/* Sub-total Taxes and Total */}
        <div className="flex flex-col items-end space-y-1 mb-10 text-right">
          <div className="flex justify-between w-full max-w-sm">
            <span>SUB-TOTAL:</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between w-full max-w-sm">
            <span>GST (5%):</span>
            <span>${GST}</span>
          </div>
          <div className="flex justify-between w-full max-w-sm">
            <span>PST ({(PST * 100).toFixed(3)}%):</span>
            <span>${PSTAmount}</span>
          </div>
          <div className="w-full max-w-sm flex border-2 border-black">
            <span className="bg-custom-blue text-black p-2 flex-grow text-left font-bold">TOTAL DUE:</span>
            <span className="bg-white text-black p-2 flex-grow text-right font-bold">${totalDue}</span>
          </div>
        </div>

        {/* Comment Box */}
        <div className="mb-8">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded"
            placeholder="Comments..."
            rows="6"
          />
        </div>

        {/* Divider */}
        <div className="mt-20 my-6 border-t-2 border-black"></div>

        {/* Error Message */}
        {showErrorMessage && (
          <div className="mb-6 text-red-500 text-center">
            Please Enter Required Fields
          </div>
        )}

        {/* Send Invoice Button */}
        <div className="flex justify-center space-x-4">
          <button onClick={handleSendInvoice} className="px-6 py-2 bg-custom-blue border border-custom-blue rounded hover:bg-custom-hover-blue hover:text-white">
            Accept
          </button>
        </div>
      </div>
  );
};

export default Invoices;
