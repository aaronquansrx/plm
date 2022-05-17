import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import BOMFileUploadInterface from '../components/BOMFileUploadInterface';
import BOMEditInterface from '../components/BOMEditInterface';
import BOMTool from '../components/BOMTool';
import BOMToolV2 from '../components/BOMToolV2';

import {HoverOverlay} from '../components/Tooltips';

import {UploadIcon, EditIcon, SheetIcon} from '../components/Icons';

import './../css/temp.css';
//import axios from 'axios';

//const server_url = process.env.REACT_APP_SERVER_URL;

//const interfaceStateModes = ["upload", "edit", "main"];

/*
const tableHeaders = [
    {Header:'_remove', accessor: '_'},
    {Header:'Custom', accessor: 'custom'}, {Header:'Manufacturer Part Number', accessor: 'MPN'}, 
    {Header:'Manufacturer', accessor: 'manufacturer'}, {Header:'Quantity', accessor: 'quantity'}
];
*/
//const columnOptions = tableHeaders.map((obj) => obj.Header);
/*const headerToAccessor = tableHeaders.reduce(function(map, obj) {
    map[obj.Header] = obj.accessor;
    return map;
}, {});*/

const apis = [
    {Header: 'Future Electronics', accessor: 'futureelectronics'}, 
    {Header: 'Digikey', accessor: 'digikey'},
    {Header: 'Mouser', accessor: 'mouser'},
    {Header: 'Element14', accessor: 'element14'},
    {Header: 'Verical', accessor: 'verical'}
];

const tableHeaders = [
    {Header:'_remove', accessor: '_'}, {Header:'Manufacturer Part Number', accessor: 'mpn'}, 
    {Header:'Quantity', accessor: 'quantity'}, {Header:'Manufacturer', accessor: 'manufacturer'},
    {Header: 'Internal Part Number', accessor: 'ipn'}, {Header: 'Customer Part Number', accessor: 'cpn'},
    {Header: 'Description', accessor: 'description'}, {Header: 'Reference Designator', accessor: 'reference'},
    {Header:'Custom', accessor: 'custom'}
];

const apiAttrs = [
    {
        Header: 'Stock',
        accessor: 'available'
    },
    {
        Header: 'MOQ',
        accessor: 'moq'
    },
    {
        Header: 'Lead Time',
        accessor: 'leadtime'
    },
    {
        Header: 'Price',
        accessor: 'prices'
    },
    {
        Header: 'SPQ',
        accessor: 'spq'
    },
    {
        Header: 'Currency',
        accessor: 'currency'
    }
];

const uploadHeaders = tableHeaders.reduce((arr, header, i) => {
    if(i !== 0){
        arr.push(header);
    }
    return arr;
}, []);

const quantityHeader = {Header:'Quantity', accessor: 'quantity'};

function BOMInterface(props){
    const [uploadedBOM, setUploadedBOM] = useState([]); // bom uploaded from file upload interface
    const [BOMData, setBOMData] = useState({bom: [], attrs: [], apis: []});
    //const [BOMColumnFields, setBOMColumnFields] = useState(); 
    const [interfaceState, setInterfaceState] = useState(0) // 0: upload, 1: main
    //const [initialUploadState, setInitialUploadState] = useState(0);
    const [initialBOMEdit, setInitialBOMEdit] = useState([]); //BOM initial input when editing BOM
    //const [image, setImage] = useState(null);

    const [apiData, setApiData] = useState(new Map());

    /*
    useEffect(()=>{
        axios({
            method: 'get',
            url: server_url+'api/image?name=digikeypricing.png'
        }).then(response => {
            const data = response.data;
            if(data.found){
                setImage(data.url);
            }
        })
    })*/

    function handleBOMUpload(bom, autoFind={found: false}){
        //assume first col is MPN
        setUploadedBOM(bom);
        if(autoFind.found){
            //console.log(apis);
            setBOMData({bom: autoFind.bom, attrs: autoFind.headers, apis: apis});
            setInterfaceState(2);
        }else{
            setInterfaceState(1);
        }
    };
    function handleEditBOM(bom, headers){
        const hs = headers;
        setBOMData({bom: bom, attrs: hs, apis: apis});
        setInterfaceState(2);
    }
    function changeState(state, bom=[]){
        //setInitialUploadState(1);
        setInterfaceState(state);
        setInitialBOMEdit(bom);
    }

    function updateApiData(dataMap){
        setApiData(new Map([...apiData, ...dataMap]));
    }
    //renders the body of interface depending on state
    function renderInterfaceState(){
        switch(interfaceState){
            case 0:
                return <BOMFileUploadInterface onBOMUpload={handleBOMUpload} headers={uploadHeaders}/>;
            case 1:
                return <BOMEditInterface bom={uploadedBOM} onFinishEdit={handleEditBOM} changeState={changeState} headers={tableHeaders}/>
            case 2:
                //return <BOMTool BOMData={BOMData} changeState={changeState}/>;
                return <BOMToolV2 bomLines={BOMData.bom} apis={BOMData.apis} 
                bomAttributes={BOMData.attrs} apiAttrs={apiAttrs} changeState={changeState} updateApiData={updateApiData} 
                apiData={apiData}/>;
            default:
                return "Unknown interface state";
        }
    }
    function handleNavChange(state, bom=[]){
        return function(){
            changeState(state, bom);
        }
    }

    //renders the header for each interface mode
    function renderNavigation(){
        const size = 35;
        return(

            <div className='IconNav'>
            <HoverOverlay tooltip={'Upload'} placement='bottom'>
            <UploadIcon onClick={handleNavChange(0)} 
            selected={interfaceState===0} size={size}/>
            </HoverOverlay>
            <HoverOverlay tooltip={'Edit'} placement='bottom'>
            <EditIcon onClick={handleNavChange(1, [])} 
            selected={interfaceState===1} size={size}/>
            </HoverOverlay>
            <HoverOverlay tooltip={'BOMTool'} placement='bottom'>
            <SheetIcon onClick={handleNavChange(2)} 
            selected={interfaceState===2} size={size}/>
            </HoverOverlay>
            </div>
        );
    }
    return ( 
        <>

            {/*image && 
            <img src={image} height={200} width={200}
            />*/}
            <div className='FlexNormal'>
            {renderNavigation()}
            </div>
        {/*interfaceStateModes[interfaceState]*/}
            {renderInterfaceState()}
        </>
    );
}

export default BOMInterface;