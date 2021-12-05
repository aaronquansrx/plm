import React, {useState} from 'react';

import BOMFileUploadInterface from './BOMFileUploadInterface';
import BOMEditInterface from './BOMEditInterface';
import BOMTool from './BOMTool';

const interfaceStateModes = ["upload", "edit", "main"];

const tableHeaders = [
    {Header:'_remove', accessor: '_'},
    {Header:'Custom', accessor: 'custom'}, {Header:'Manufacturer Part Number', accessor: 'MPN'}, 
    {Header:'Manufacturer', accessor: 'manufacturer'}, {Header:'Quantity', accessor: 'quantity'}
];
const columnOptions = tableHeaders.map((obj) => obj.Header);
const headerToAccessor = tableHeaders.reduce(function(map, obj) {
    map[obj.Header] = obj.accessor;
    return map;
}, {});


function BOMInterface(props){
    const [uploadedBOM, setUploadedBOM] = useState(null); // bom uploaded from file upload interface
    const [BOMData, setBOMData] = useState();
    //const [BOMColumnFields, setBOMColumnFields] = useState(); 
    const [interfaceState, setInterfaceState] = useState(0) // 0: upload, 1: main
    //const [initialUploadState, setInitialUploadState] = useState(0);
    const [initialBOMEdit, setInitialBOMEdit] = useState([]); //BOM initial input when editing BOM
    function getUploadedBOM(bom, state=1){
        //assume first col is MPN
        setUploadedBOM(bom);
        //setBOMColumnFields(attrs);
        setInterfaceState(state);
    };
    function handleEditBOM(bom, headers){
        setBOMData({'BOM': bom, 'header': headers});
        setInterfaceState(2);
    }
    function changeState(state, bom){
        //setInitialUploadState(1);
        setInterfaceState(state);
        setInitialBOMEdit(bom);
    }
    function renderInterfaceState(){
        switch(interfaceState){
            case 0:
                return <BOMFileUploadInterface onBOMUpload={getUploadedBOM}/>;
            case 1:
                return <BOMEditInterface bom={uploadedBOM} onFinishEdit={handleEditBOM} changeState={changeState}/>
            case 2:
                return <BOMTool BOMData={BOMData} changeState={changeState}/>;
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