import Link from 'next/link';


export default function Home() {
  return (
    <div className="flex flex-grow flex-col justify-center">
      <div className="flex flex-col flex-grow items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Welcome</h2>
          <div className="flex space-x-5 justify-center">
          <Link href="/invoice">
            <button className="inline-block py-2 px-4 bg-custom-blue border-custom-blue border-2 text-black rounded font-semibold transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-110 duration-500 hover: drop-shadow-xl hover:border-black">
              Create A New Invoice
            </button>
          </Link>
          <Link href="/editInvoice">
            <button className="inline-block py-2 px-4 bg-custom-blue border-custom-blue border-2 text-black rounded font-semibold transition ease-in-out delay-50 hover:-translate-y-1 hover:scale-110 duration-500 hover: drop-shadow-xl hover:border-black">
              Edit An Existing Invoice
            </button>
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
