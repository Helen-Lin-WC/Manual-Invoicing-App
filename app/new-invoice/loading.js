export default function Loading(){
    return(
        <div className="flex flex-grow justify-center items-center min-h-screen animate-pulse">
            <div className="w-[1136px] h-[1515px] my-8 bg-white">

                <div className="flex flex-col space-y-1">
                    <div className="flex flex-row m-8 justify-between">
                        <div className="flex flex-col space-y-3">
                            <div className="w-[250px] h-[100px] bg-gray-200" ></div>
                            <div className="w-[250px] h-[100px] bg-gray-200" ></div>
                        </div>

                        <div className="flex flex-col space-y-3">
                                <div className="border">                      
                                    <div className="w-[200px] h-[50px] bg-gray-200"></div>
                                    <div className="w-[200px] h-[50px]"></div>
                                </div>
                                <div className="border">               
                                    <div className="w-[200px] h-[50px] bg-gray-200"></div>
                                    <div className="w-[200px] h-[50px]"></div>
                                </div>
                        </div> 
                    </div>

                  

                    <div className="flex flex-col items-center space-y-3">
                        <div className="w-[1000px] h-[362px] bg-gray-200">  
                        </div> 
                        <div className="w-[1000px] h-[150px] bg-gray-200">
                        </div>          
                    </div>
                        
                </div>
            </div>
        </div>
    );
}