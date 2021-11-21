import React, {useState} from 'react';

import BOMFileUploadInterface from './BOMFileUploadInterface';
import BOMTool from './BOMTool';

const interfaceStateModes = ["upload", "main"];
function BOMInterface(props){
    const [BOMData, setBOMData] = useState();
    //const [BOMColumnFields, setBOMColumnFields] = useState(); 
    const [interfaceState, setInterfaceState] = useState(0) // 0: upload, 1: main
    function getUploadedBOM(bom, fields){
        setBOMData({'BOM': bom, "columnFields": fields});
        //setBOMColumnFields(attrs);
        setInterfaceState(1);
    };
    function renderInterfaceState(){
        switch(interfaceState){
            case 0:
                return <BOMFileUploadInterface onBOMUpload={getUploadedBOM}/>;
            case 1:
                return <BOMTool BOMData={BOMData} />;
            default:
                return "Unknown interface state";
        }
    }
    return ( 
        <div>
        {interfaceStateModes[interfaceState]}
        {renderInterfaceState()}
        </div>
    );
}

export default BOMInterface;