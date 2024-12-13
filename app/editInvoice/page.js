"use client" // tells react this page should be rendered on the client side
import { useEffect, useState } from 'react';

//hooks for form functionality
export default function ViewInvoices() {
  const [viewInvoices, setViewInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [initialSelectedInvoice, setInitialSelectedInvoice] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [filters, setFilters] = useState({
    invoiceNo: '',
    invoiceDate: '',
    vendorName: '',
    companyName: '',
    itemDescription: '',
    itemType: '',
    saleUnitPrice: ''
  });

  //fetches invoice details from db views and sets it to a variable
  useEffect(() => {
    fetch('https://manualinvoice.wcap.ca:443/api/viewInvoices')
      .then(response => response.json())
      .then(data => setViewInvoices(data))
      .catch(error => console.error('Error fetching invoices:', error));
  }, []);

  useEffect(() => {
    // Fetch the invoice data, including INVOICE_PAID status
    fetch(`https://manualinvoice.wcap.ca:443/api/viewInvoices`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Fetched invoice data:', data); // Log the data
        setInvoice(data);
        if (data.INVOICE_PAID === 'Y') {
          setIsReadOnly(true); // Make form read-only if the invoice is already paid
        }
      })
      .catch(error => console.error('Error fetching invoice:', error));
  }, []);

  //handles fitering
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  //functionality to fetch invoices matching the filters selected
  const applyFilters = () => {
    const filtered = viewInvoices.filter((invoice) => {
      const matchInvoice = (field, value) => !value || invoice[field]?.toLowerCase().includes(value.toLowerCase());
      const matchItem = (field, value) => !value || invoice.ITEMS.some(item => item[field]?.toLowerCase().includes(value.toLowerCase()));

      return (
        matchInvoice('INVOICE_NO', filters.invoiceNo) &&
        matchInvoice('INVOICE_DATE', filters.invoiceDate) &&
        matchInvoice('VENDOR_NAME', filters.vendorName) &&
        matchInvoice('COMPANY_NAME', filters.companyName) &&
        matchItem('ITEM_DESCRIPTION', filters.itemDescription) &&
        matchItem('ITEM_TYPE', filters.itemType) &&
        matchItem('SALE_UNIT_PRICE', filters.saleUnitPrice) &&
        matchItem('QUANTITY', filters.quantity) &&
        matchItem('INVOICE_PAID', filters.invoicePaid)
      );
    });
    setFilteredInvoices(filtered);
  };

  //saves a deep copy of the invoice details to compare to the edited one
  const handleSelectInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setInitialSelectedInvoice(JSON.parse(JSON.stringify(invoice))); // Deep copy to avoid reference issues
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedInvoice({
      ...selectedInvoice,
      [name]: value
    });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = selectedInvoice.ITEMS.map((item, i) =>
      i === index ? { ...item, [name]: value } : item
    );
    setSelectedInvoice({ ...selectedInvoice, ITEMS: updatedItems });
  };

  //function to check if there are any differences between the saved deep copy of the invoice and the one in the form.
  const hasChanges = () => {
    return JSON.stringify(selectedInvoice) !== JSON.stringify(initialSelectedInvoice);
  };
  
  //fucntion for handling saving updated invoice when clicking the "save" button
  const handleSave = () => {
    if (!hasChanges()) {
      alert('No changes made to the invoice.');
      return;
    }
  
    if (window.confirm('Are you sure you want to make this change?')) {
      console.log('Saving invoice:', selectedInvoice);
  
      fetch(`https://manualinvoice.wcap.ca:443/api/updateInvoice/${selectedInvoice.INVOICE_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedInvoice)
      })
        .then(response => {
          console.log('Response status:', response.status);
          if (!response.ok) {
            return response.json().then(error => {
              console.log('Response error details:', error);
              throw new Error(error.details || 'Unknown error');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Response data:', data);
          if (data.message === 'Invoice updated successfully') {
            setViewInvoices(viewInvoices.map(invoice => (
              invoice.INVOICE_ID === selectedInvoice.INVOICE_ID ? selectedInvoice : invoice
            )));
            setSelectedInvoice(null);
            setInitialSelectedInvoice(null);
            alert('Invoice updated successfully');
            window.location.href = '/editInvoice'; // Refreshes the page after invoice is updated
          } else {
            alert('Error updating invoice: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error updating invoice:', error.message);
          alert('Error updating invoice: ' + error.message);
        });
    }
  };

  //function to handle updating an invoice payment status
  const handlePaymentStatusClick = () => {
    if (selectedInvoice.INVOICE_PAID === 'N') {
      const userConfirmed = window.confirm('This will set the Invoice as "Paid". This Invoice will be locked if you do this. Are you sure you want to do this?');
  
      if (userConfirmed) {
        fetch(`https://manualinvoice.wcap.ca:443/api/updateInvoicePayment/${selectedInvoice.INVOICE_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ INVOICE_PAID: 'Y' }),
        })
          .then(async response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
  
            const data = await response.json();
  
            if (data.success) {
              alert('Payment status updated successfully!');
              window.location.reload(); // Refresh the page to see changes
            } else {
              alert('Failed to update payment status.');
            }
          })
          .catch(error => {
            console.error('Error updating payment status:', error);
            alert('An error occurred while updating the payment status.');
          });
      }
    }
  };

  // Function to handle the deletion of the selected invoice
  const handleDelete = () => {
    if (!selectedInvoice) {
      alert('Please select an invoice to delete.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this invoice?')) {
      fetch(`https://manualinvoice.wcap.ca:443/api/deleteInvoice/${selectedInvoice.INVOICE_ID}`, {
        method: 'DELETE',
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(error => {
              throw new Error(error.details || 'Unknown error');
            });
          }
          return response.json();
        })
        .then(data => {
          if (data.message === 'Invoice deleted successfully') {
            setViewInvoices(viewInvoices.filter(invoice => invoice.INVOICE_ID !== selectedInvoice.INVOICE_ID));
            setSelectedInvoice(null);
            setInitialSelectedInvoice(null);
            alert('Invoice deleted successfully');
            window.location.href = '/editInvoice'; // Refreshes the page after invoice is deleted
          } else {
            alert('Error deleting invoice: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error deleting invoice:', error.message);
          alert('Error deleting invoice: ' + error.message);
        });
    }
  };
  
  

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      <header className="bg-custom-blue text-black rounded p-4 text-center">
        <h1 className="text-2xl font-bold">Invoices</h1>
      </header>

      <main className="flex-grow p-4">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Invoice List</h2>

          {/* Filter Inputs */}
          <div className="mb-4 grid grid-cols-3 gap-4">
            <input type="text" name="invoiceNo" placeholder="Invoice Number" value={filters.invoiceNo} onChange={handleFilterChange} className="p-2 border" />
            <input type="date" name="invoiceDate" placeholder="Invoice Date" value={filters.invoiceDate} onChange={handleFilterChange} className="p-2 border" />
            <input type="text" name="vendorName" placeholder="Vendor Name" value={filters.vendorName} onChange={handleFilterChange} className="p-2 border" />
            <input type="text" name="companyName" placeholder="Company Name" value={filters.companyName} onChange={handleFilterChange} className="p-2 border" />
            <input type="text" name="itemDescription" placeholder="Item Description" value={filters.itemDescription} onChange={handleFilterChange} className="p-2 border" />
            <input type="text" name="itemType" placeholder="Item Type" value={filters.itemType} onChange={handleFilterChange} className="p-2 border" />
            <input type="text" name="saleUnitPrice" placeholder="Sale Unit Price" value={filters.saleUnitPrice} onChange={handleFilterChange} className="p-2 border" />
          </div>
          <button onClick={applyFilters} className="inline-block py-2 px-4 bg-custom-blue  border-custom-blue border-2 text-black rounded font-semibold transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-110 duration-500 hover: drop-shadow-xl hover:border-black">Apply Filters</button>

          {/* Table for filtered invoices */}
          <table className="min-w-full bg-white mt-4">
            <thead>
              <tr>
                <th className="py-2">Select</th>
                <th className="py-2">Invoice Number</th>
                <th className="py-2">Invoice Date</th>
                <th className="py-2">Vendor Name</th>
                <th className="py-2">Company Name</th>
                <th className="py-2">Item Description</th>
                <th className="py-2">Item Type</th>
                <th className="py-2">Sale Unit Price</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => (
                invoice.ITEMS.map((item, itemIndex) => (
                  <tr key={`${index}-${itemIndex}`} onClick={() => handleSelectInvoice(invoice)} className={selectedInvoice?.INVOICE_ID === invoice.INVOICE_ID ? 'bg-yellow-100' : ''}>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selectedInvoice?.INVOICE_ID === invoice.INVOICE_ID}
                        onChange={() => handleSelectInvoice(invoice)}
                      />
                    </td>
                    <td className="py-2">{invoice.INVOICE_NO}</td>
                    <td className="py-2">{invoice.INVOICE_DATE}</td>
                    <td className="py-2">{invoice.VENDOR_NAME}</td>
                    <td className="py-2">{invoice.COMPANY_NAME}</td>
                    <td className="py-2">{item.ITEM_DESCRIPTION}</td>
                    <td className="py-2">{item.ITEM_TYPE}</td>
                    <td className="py-2">{item.SALE_UNIT_PRICE}</td>
                    <td className="py-2">{item.QUANTITY}</td>
                    <td className="py-2">{item.INVOICE_PAID}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>

          {/* Form for editing selected invoices */}
          {selectedInvoice && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-4">Edit Invoice</h2>
              <form className="flex flex-wrap">
                <div className="flex-1 mb-4 px-2">
                  <label className="block text-gray-700">Company Name</label>
                  <input type="text" 
                    name="COMPANY_NAME" 
                    value={selectedInvoice.COMPANY_NAME} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border border-gray-300 rounded" 
                    disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                  />
                </div>
                <div className="flex-1 mb-4 px-2">
                  <label className="block text-gray-700">Vendor Name/RE</label>
                  <input type="text" 
                    name="VENDOR_NAME" 
                    value={selectedInvoice.VENDOR_NAME} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border border-gray-300 rounded" 
                    disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                  />
                </div>
                <div className="flex-1 mb-4 px-2">
                  <label className="block text-gray-700">Address</label>
                  <input type="text" 
                    name="ADDRESS" 
                    value={selectedInvoice.ADDRESS} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border border-gray-300 rounded" 
                    disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                  />
                </div>
                <div className="flex-1 mb-4 px-2">
                  <label className="block text-gray-700">City</label>
                  <input type="text" 
                    name="CITY" 
                    value={selectedInvoice.CITY} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border border-gray-300 rounded" 
                    disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                  />
                </div>
                <div className="flex-1 mb-4 px-2">
                  <label className="block text-gray-700">Province</label>
                  <input type="text" 
                    name="PROVINCE" 
                    value={selectedInvoice.PROVINCE} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border border-gray-300 rounded"  
                    disabled={selectedInvoice.INVOICE_PAID === 'Y'}
                  />
                </div>
                <div className="flex-1 mb-4 px-2">
                  <label className="block text-gray-700">Postal Code</label>
                  <input type="text" 
                    name="POSTAL_CODE" 
                    value={selectedInvoice.POSTAL_CODE} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border border-gray-300 rounded" 
                    disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                  />
                </div>

                {selectedInvoice.ITEMS.map((item, index) => (
                  <div key={index} className="w-full flex flex-wrap">
                    <div className="flex-1 mb-4 px-2">
                      <label className="block text-gray-700">Item Description</label>
                      <input type="text" 
                        name="ITEM_DESCRIPTION" 
                        value={item.ITEM_DESCRIPTION} 
                        onChange={(e) => handleItemChange(index, e)} 
                        className="w-full p-2 border border-gray-300 rounded" 
                        disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                      />
                    </div>
                    <div className="flex-1 mb-4 px-2">
                      <label className="block text-gray-700">Item Type</label>
                      <input type="text" 
                        name="ITEM_TYPE" 
                        value={item.ITEM_TYPE} 
                        onChange={(e) => handleItemChange(index, e)} 
                        className="w-full p-2 border border-gray-300 rounded" 
                        disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                      />
                    </div>
                    <div className="flex-1 mb-4 px-2">
                      <label className="block text-gray-700">Sale Unit Price</label>
                      <input type="text" 
                        name="SALE_UNIT_PRICE" 
                        value={item.SALE_UNIT_PRICE} 
                        onChange={(e) => handleItemChange(index, e)} 
                        className="w-full p-2 border border-gray-300 rounded" 
                        disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                      />
                    </div>
                    <div className="flex-1 mb-4 px-2">
                      <label className="block text-gray-700">Quantity</label>
                      <input type="text" 
                        name="QUANTITY" 
                        value={item.QUANTITY} 
                        onChange={(e) => handleItemChange(index, e)} 
                        className="w-full p-2 border border-gray-300 rounded" 
                        disabled={selectedInvoice.INVOICE_PAID === 'Y'} 
                      />
                    </div>
                    <div className="flex-1 mb-4 px-2">
                      <label className="block text-gray-700">Paid</label>
                      <input type="text" 
                        name="INVOICE_PAID" 
                        value={selectedInvoice.INVOICE_PAID === 'Y' ? 'Yes' : 'No'} 
                        onChange={handleInputChange} 
                        className="w-full p-2 border border-gray-300 rounded" 
                        disabled={true} 
                     />
                    </div>
                  </div>
                ))}
                <div className="flex space-x-5">
                  
                  {/*button for updating invoices*/}
                  <button type="button" 
                   onClick={handleSave} 
                   className="inline-block py-2 px-4 bg-custom-blue  border-custom-blue border-2 text-black rounded font-semibold transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-110 duration-500 hover: drop-shadow-xl hover:border-black"
                   disabled={selectedInvoice.INVOICE_PAID === 'Y' || isReadOnly}
                  >
                    Save
                  </button>

                  {/*button for deleting invoices*/}
                  <button type="button" 
                   onClick={handleDelete} 
                   className="inline-block py-2 px-4 bg-red-500 text-white p-2 rounded font-semibold transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-110 duration-500 hover: drop-shadow-xl hover:border-none" 
                   disabled={selectedInvoice.INVOICE_PAID === 'Y' || isReadOnly}
                  >
                    Delete Invoice
                  </button>

                  {/*button for updating payment status*/}
                  <button
                    type="button"
                    onClick={handlePaymentStatusClick}
                    className="inline-block py-2 px-4 bg-blue-500 text-white rounded"
                    disabled={selectedInvoice.INVOICE_PAID === 'Y' || isReadOnly}
                  >
                    Payment Status
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

