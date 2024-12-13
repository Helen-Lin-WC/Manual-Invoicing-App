
export default function Header({title}){
    return(      
        <header className="bg-custom-blue text-black p-4 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        </header>
    );
}