import Image from 'next/image';

export default function Navbar(){
    return(
        <nav className="text-black p-4  flex place-items-start bg-white border-b border-gray-300 shadow-sm">
        <Image src="/assets/wcaplogo.png" alt="Whitecap Logo" width={100} height={100} className="mr-2"/>
        <h1 className="text-2xl font-bold text-center ps-2 text-gray-700">Manual Invoicing</h1>
        </nav>
    );
}

