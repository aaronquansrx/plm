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

const apis = [
    {Header: 'Future Electronics', accessor: 'futureelectronics'}, 
    {Header: 'Digikey', accessor: 'digikey'},
    {Header: 'Mouser', accessor: 'mouser'},
    {Header: 'Element14', accessor: 'element14'}
];


function BOMInterface(props){
    const [uploadedBOM, setUploadedBOM] = useState(null); // bom uploaded from file upload interface
    const [BOMData, setBOMData] = useState();
    //const [BOMColumnFields, setBOMColumnFields] = useState(); 
    const [interfaceState, setInterfaceState] = useState(0) // 0: upload, 1: main
    //const [initialUploadState, setInitialUploadState] = useState(0);
    const [initialBOMEdit, setInitialBOMEdit] = useState([]); //BOM initial input when editing BOM
    function handleUploadedBOM(bom, state=1){
        //assume first col is MPN
        setUploadedBOM(bom);
        const autofind = autoFindMPN(bom);
        if(autofind.found){
            console.log('found mpn');
            setBOMData({bom: autofind.bom, headers: autofind.headers.concat(apis)});
            setInterfaceState(2);
        }else{
            setInterfaceState(state);
        }
    };
    function handleEditBOM(bom, headers){
        setBOMData({bom: bom, headers: headers.concat(apis)});
        setInterfaceState(2);
    }
    function changeState(state, bom){
        //setInitialUploadState(1);
        setInterfaceState(state);
        setInitialBOMEdit(bom);
    }
    //renders the body of interface depending on state
    function renderInterfaceState(){
        switch(interfaceState){
            case 0:
                return <BOMFileUploadInterface onBOMUpload={handleUploadedBOM}/>;
            case 1:
                return <BOMEditInterface bom={uploadedBOM} onFinishEdit={handleEditBOM} changeState={changeState}/>
            case 2:
                return <BOMTool BOMData={BOMData} changeState={changeState}/>;
            default:
                return "Unknown interface state";
        }
    }

    //renders the header for each interface mode
    function renderInterfaceMode(){
        switch(interfaceState){

        }
    }
    function autoFindMPN(bom){
        const search = ['mpn', 'manufacturing part number'];
        if(bom.length > 0){
            const col = bom[0].findIndex((val) => search.includes(val.toLowerCase()));
            if(col !== -1){
                const bomData = bom.map((line) => {
                    return {
                        mpn: line[col]
                    };
                });
                return {found: true, bom: bomData, headers: [{Header: 'MPN', accessor: 'mpn'}]};
            }
        }
        return {found: false};
    }
    return ( 
        <div>
        {interfaceStateModes[interfaceState]}
        {renderInterfaceState()}
        </div>
    );
}

export default BOMInterface;