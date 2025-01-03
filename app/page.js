"use client"
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [viewInvoices, setViewInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [initialSelectedInvoice, setInitialSelectedInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const initialFilterState = {
    invoiceNo: '',
    invoiceDate: '',
    vendorName: '',
    companyName: '',
    itemDescription: '',
    itemType: '',
    saleUnitPrice: '',
    quantity: '',
    invoicePaid: '', 
  };

  const [filters, setFilters] = useState(initialFilterState);

   // //fetches invoice details from db views and sets it to a variable
  // useEffect(() => {
  //   fetch('https://manualinvoice.wcap.ca:443/api/viewInvoices')
  //     .then(response => response.json())
  //     .then(data => setViewInvoices(data))
  //     .catch(error => console.error('Error fetching invoices:', error));
  // }, []);

  // useEffect(() => {
  //   // Fetch the invoice data, including INVOICE_PAID status
  //   fetch(`https://manualinvoice.wcap.ca:443/api/viewInvoices`)
  //     .then(response => {
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }
  //       return response.json();
  //     })
  //     .then(data => {
  //       console.log('Fetched invoice data:', data); // Log the data
  //       setInvoice(data);
  //       if (data.INVOICE_PAID === 'Y') {
  //         setIsReadOnly(true); // Make form read-only if the invoice is already paid
  //       }
  //     })
  //     .catch(error => console.error('Error fetching invoice:', error));
  // }, []);
  
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

  const resetFilters = () => {
      setFilters(initialFilterState);
      applyFilters();
  };

  //TODO Remove mock data
  // Add this mock data instead:
const mockInvoices = [
  {
    INVOICE_ID: 1,
    INVOICE_NO: 'INV001',
    INVOICE_DATE: '2024-01-01',
    VENDOR_NAME: 'John Doe',
    COMPANY_NAME: 'ABC Corp',
    ADDRESS: '123 Main St',
    CITY: 'Calgary',
    PROVINCE: 'Alberta',
    POSTAL_CODE: 'T2P 1G1',
    ITEMS: [
      {
        ITEM_DESCRIPTION: 'Consulting Services',
        ITEM_TYPE: 'Service',
        SALE_UNIT_PRICE: '10000.00',
        QUANTITY: '450',
        INVOICE_PAID: 'Y'
      },
      {
        ITEM_DESCRIPTION: 'Software License',
        ITEM_TYPE: 'License',
        SALE_UNIT_PRICE: '900.00',
        QUANTITY: '100',
        INVOICE_PAID: 'Y'
      }
    ]
  },
  {
    INVOICE_ID: 2,
    INVOICE_NO: 'INV002',
    INVOICE_DATE: '2024-01-15',
    VENDOR_NAME: 'Jane Smith',
    COMPANY_NAME: 'XYZ Ltd',
    ADDRESS: '456 Oak Ave',
    CITY: 'Edmonton',
    PROVINCE: 'Alberta',
    POSTAL_CODE: 'T5J 2R4',
    ITEMS: [
      {
        ITEM_DESCRIPTION: 'Hardware Setup',
        ITEM_TYPE: 'Hardware',
        SALE_UNIT_PRICE: '750.00',
        QUANTITY: '1',
        INVOICE_PAID: 'N'
      }
    ]
  }
];

  
  useEffect(() => {
    setViewInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);
  }, []);

  //saves a deep copy of the invoice details to compare to the edited one
  const handleSelectInvoice = (invoice) => {
    if (selectedInvoice?.INVOICE_ID === invoice.INVOICE_ID) {
      setSelectedInvoice(null);  // Unselect the invoice
      setInitialSelectedInvoice(null);  // Reset the deep copy state
    } else {
    setSelectedInvoice(invoice);
    setInitialSelectedInvoice(JSON.parse(JSON.stringify(invoice))); // Deep copy to avoid reference issues
    }
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
  
  //TODO uncomment 
  // //fucntion for handling saving updated invoice when clicking the "save" button
  // const handleSave = () => {
  //   if (!hasChanges()) {
  //     alert('No changes made to the invoice.');
  //     return;
  //   }
  
  //   if (window.confirm('Are you sure you want to make this change?')) {
  //     console.log('Saving invoice:', selectedInvoice);
  
  //     fetch(`https://manualinvoice.wcap.ca:443/api/updateInvoice/${selectedInvoice.INVOICE_ID}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(selectedInvoice)
  //     })
  //       .then(response => {
  //         console.log('Response status:', response.status);
  //         if (!response.ok) {
  //           return response.json().then(error => {
  //             console.log('Response error details:', error);
  //             throw new Error(error.details || 'Unknown error');
  //           });
  //         }
  //         return response.json();
  //       })
  //       .then(data => {
  //         console.log('Response data:', data);
  //         if (data.message === 'Invoice updated successfully') {
  //           setViewInvoices(viewInvoices.map(invoice => (
  //             invoice.INVOICE_ID === selectedInvoice.INVOICE_ID ? selectedInvoice : invoice
  //           )));
  //           setSelectedInvoice(null);
  //           setInitialSelectedInvoice(null);
  //           alert('Invoice updated successfully');
  //           window.location.href = '/editInvoice'; // Refreshes the page after invoice is updated
  //         } else {
  //           alert('Error updating invoice: ' + (data.error || 'Unknown error'));
  //         }
  //       })
  //       .catch(error => {
  //         console.error('Error updating invoice:', error.message);
  //         alert('Error updating invoice: ' + error.message);
  //       });
  //   }
  // };

  //TODO remove mock
  // 3. Modify the handleSave function to work with mock data:
const handleSave = () => {
  if (!hasChanges()) {
    alert('No changes made to the invoice.');
    return;
  }

  if (window.confirm('Are you sure you want to make this change?')) {
    // Update the local state instead of making an API call
    setViewInvoices(viewInvoices.map(invoice => 
      invoice.INVOICE_ID === selectedInvoice.INVOICE_ID ? selectedInvoice : invoice
    ));
    setFilteredInvoices(prevFiltered => prevFiltered.map(invoice =>
      invoice.INVOICE_ID === selectedInvoice.INVOICE_ID ? selectedInvoice : invoice
    ));
    setSelectedInvoice(null);
    setInitialSelectedInvoice(null);
    alert('Invoice updated successfully');
  }
};

  //TODO uncomment 
  // //function to handle updating an invoice payment status
  // const handlePaymentStatusClick = () => {
  //   if (selectedInvoice.INVOICE_PAID === 'N') {
  //     const userConfirmed = window.confirm('This will set the Invoice as "Paid". This Invoice will be locked if you do this. Are you sure you want to do this?');
  
  //     if (userConfirmed) {
  //       fetch(`https://manualinvoice.wcap.ca:443/api/updateInvoicePayment/${selectedInvoice.INVOICE_ID}`, {
  //         method: 'PUT',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ INVOICE_PAID: 'Y' }),
  //       })
  //         .then(async response => {
  //           if (!response.ok) {
  //             throw new Error('Network response was not ok');
  //           }
  
  //           const data = await response.json();
  
  //           if (data.success) {
  //             alert('Payment status updated successfully!');
  //             window.location.reload(); // Refresh the page to see changes
  //           } else {
  //             alert('Failed to update payment status.');
  //           }
  //         })
  //         .catch(error => {
  //           console.error('Error updating payment status:', error);
  //           alert('An error occurred while updating the payment status.');
  //         });
  //     }
  //   }
  // };

  //TODO Remove mock
  const handlePaymentStatusClick = () => {
    if (selectedInvoice.INVOICE_PAID === 'N') {
      const userConfirmed = window.confirm('This will set the Invoice as "Paid". This Invoice will be locked if you do this. Are you sure you want to do this?');
  
      if (userConfirmed) {
        const updatedInvoice = {
          ...selectedInvoice,
          INVOICE_PAID: 'Y'
        };
  
        setViewInvoices(viewInvoices.map(invoice =>
          invoice.INVOICE_ID === selectedInvoice.INVOICE_ID ? updatedInvoice : invoice
        ));
        setFilteredInvoices(prevFiltered => prevFiltered.map(invoice =>
          invoice.INVOICE_ID === selectedInvoice.INVOICE_ID ? updatedInvoice : invoice
        ));
        setSelectedInvoice(updatedInvoice);
        setIsReadOnly(true);
        alert('Payment status updated successfully!');
      }
    }
  };

  //TODO Uncomment the delete function
  // Function to handle the deletion of the selected invoice
  // const handleDelete = () => {
  //   if (!selectedInvoice) {
  //     alert('Please select an invoice to delete.');
  //     return;
  //   }

  //   if (window.confirm('Are you sure you want to delete this invoice?')) {
  //     fetch(`https://manualinvoice.wcap.ca:443/api/deleteInvoice/${selectedInvoice.INVOICE_ID}`, {
  //       method: 'DELETE',
  //     })
  //       .then(response => {
  //         if (!response.ok) {
  //           return response.json().then(error => {
  //             throw new Error(error.details || 'Unknown error');
  //           });
  //         }
  //         return response.json();
  //       })
  //       .then(data => {
  //         if (data.message === 'Invoice deleted successfully') {
  //           setViewInvoices(viewInvoices.filter(invoice => invoice.INVOICE_ID !== selectedInvoice.INVOICE_ID));
  //           setSelectedInvoice(null);
  //           setInitialSelectedInvoice(null);
  //           alert('Invoice deleted successfully');
  //           window.location.href = '/editInvoice'; // Refreshes the page after invoice is deleted
  //         } else {
  //           alert('Error deleting invoice: ' + (data.error || 'Unknown error'));
  //         }
  //       })
  //       .catch(error => {
  //         console.error('Error deleting invoice:', error.message);
  //         alert('Error deleting invoice: ' + error.message);
  //       });
  //   }
  // };

  //TODO delete mock function
  const handleDelete = () => {
    if (!selectedInvoice) {
      alert('Please select an invoice to delete.');
      return;
    }
  
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      // Update local state instead of making an API call
      const updatedInvoices = viewInvoices.filter(invoice => 
        invoice.INVOICE_ID !== selectedInvoice.INVOICE_ID
      );
      setViewInvoices(updatedInvoices);
      setFilteredInvoices(updatedInvoices);
      setSelectedInvoice(null);
      setInitialSelectedInvoice(null);
      alert('Invoice deleted successfully');
    }
  };


  return (
    <div className="flex flex-grow flex-col justify-center">
    <div className="flex flex-grow flex-col justify-between">
        <div className="flex-grow p-4">
          <div className="bg-white shadow-lg rounded-lg p-6">
      <div className='flex flex-row justify-between'>
        <h2 className="text-xl font-semibold mb-4">Invoice List</h2>    
        <Link href="/new-invoice">
          <button className="inline-block py-2 px-4 mb-4 bg-gray-300 text-black rounded font-semibold hover:bg-gray-400">
            Create New Invoice
          </button>
        </Link>  
      </div>
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
          <div className="space-x-4">
          <button onClick={applyFilters} className="inline-block py-2 px-4 bg-gray-300 text-black rounded font-semibold hover:bg-gray-400">Apply Filters</button>
          <button onClick={resetFilters} className="inline-block py-2 px-4 bg-gray-100 text-black rounded font-semibold hover:bg-gray-200">Clear</button>
          </div>

          {/* Table for filtered invoices */}
          <table className="min-w-full bg-white mt-4 table-fixed">
            <thead>
              <tr className="py-2">
                <th className="py-2 text-center">Select</th>
                <th className="py-2 text-center">Invoice Number</th>
                <th className="py-2 text-center">Invoice Date</th>
                <th className="py-2 text-center">Vendor Name</th>
                <th className="py-2 text-center">Company Name</th>
                <th className="py-2 text-center">Item Description</th>
                <th className="py-2 text-center">Item Type</th>
                <th className="py-2 text-center">Sale Unit Price</th>
                <th className="py-2 text-center">Quantity</th>
                <th className="py-2 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => (
                invoice.ITEMS.map((item, itemIndex) => (
                  <tr key={`${index}-${itemIndex}`} onClick={() => handleSelectInvoice(invoice)} className={selectedInvoice?.INVOICE_ID === invoice.INVOICE_ID ? 'bg-yellow-100' : ''}>
                    <td className="py-2 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedInvoice?.INVOICE_ID === invoice.INVOICE_ID}
                        onChange={() => handleSelectInvoice(invoice)}
                      />
                    </td>
                    <td className="py-2 text-center">{invoice.INVOICE_NO}</td>
                    <td className="py-2 text-center">{invoice.INVOICE_DATE}</td>
                    <td className="py-2 text-center">{invoice.VENDOR_NAME}</td>
                    <td className="py-2 text-center">{invoice.COMPANY_NAME}</td>
                    <td className="py-2 text-center">{item.ITEM_DESCRIPTION}</td>
                    <td className="py-2 text-center">{item.ITEM_TYPE}</td>
                    <td className="py-2 text-center">{item.SALE_UNIT_PRICE}</td>
                    <td className="py-2 text-center">{item.QUANTITY}</td>
                    <td className="py-2 text-center">{item.INVOICE_PAID}</td>
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
                   className="inline-block py-2 px-4 bg-red-500 p-2 rounded font-semibold transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-110 duration-500 hover: drop-shadow-xl hover:border-none" 
                   disabled={selectedInvoice.INVOICE_PAID === 'Y' || isReadOnly}
                  >
                    Delete Invoice
                  </button>

                  {/*button for updating payment status*/}
                  <button
                    type="button"
                    onClick={handlePaymentStatusClick}
                    className="inline-block py-2 px-4 bg-blue-500 rounded"
                    disabled={selectedInvoice.INVOICE_PAID === 'Y' || isReadOnly}
                  >
                    Payment Status
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
