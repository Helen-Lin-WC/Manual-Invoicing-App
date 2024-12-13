import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      <header className="bg-custom-blue text-black p-4  flex place-items-start ">
        <Image src="/assets/wcaplogo.png" alt="Whitecap Logo" width={100} height={100} className="mr-2"/>
        <h1 className="text-2xl font-bold text-center text-white">Manual Invoicing</h1>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-6 text-center space-x-5">
          <h2 className="text-xl font-semibold mb-4">Welcome</h2>
          <Link href="/invoice">
            <button className="text-white inline-block py-2 px-4 bg-custom-blue border-custom-blue border-2 text-black rounded font-semibold transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-110 duration-500 hover: drop-shadow-xl hover:border-black">
              Create A New Invoice
            </button>
          </Link>
          <Link href="/editInvoice">
            <button className="text-white inline-block py-2 px-4 bg-custom-blue  border-custom-blue border-2 text-black rounded font-semibold transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-110 duration-500 hover: drop-shadow-xl hover:border-black">
              Edit An Existing Invoice
            </button>
          </Link>
        </div>
      </main>

      <footer className="text-white bg-custom-blue text-black p-4 text-center">
        <p>&copy; 2024 Whitecap Resources.  All rights reserved.</p>
      </footer>
    </div>
  );
}
