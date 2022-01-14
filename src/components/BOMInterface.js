import React, {useEffect, useState} from 'react';

import BOMFileUploadInterface from './BOMFileUploadInterface';
import BOMEditInterface from './BOMEditInterface';
import BOMTool from './BOMTool';


import {UploadIcon, EditIcon, SheetIcon} from './Icons';

import './../css/temp.css';
import axios from 'axios';

const server_url = process.env.REACT_APP_SERVER_URL;

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
    //{Header: 'Element14', accessor: 'element14'},
    {Header: 'Verical', accessor: 'verical'}
];

function BOMInterface(props){
    const [uploadedBOM, setUploadedBOM] = useState([]); // bom uploaded from file upload interface
    const [BOMData, setBOMData] = useState({bom: [], bomAttrs: [], apis: []});
    //const [BOMColumnFields, setBOMColumnFields] = useState(); 
    const [interfaceState, setInterfaceState] = useState(0) // 0: upload, 1: main
    //const [initialUploadState, setInitialUploadState] = useState(0);
    const [initialBOMEdit, setInitialBOMEdit] = useState([]); //BOM initial input when editing BOM
    const [image, setImage] = useState(null);

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

    function handleBOMUpload(bom, options){
        //assume first col is MPN
        setUploadedBOM(bom);
        if(options.autofind){
            const autofind = autoFindMPN(bom);
            if(autofind.found){
                console.log('found mpn');
                //const hs = autofind.headers.concat(apis);
                const hs = autofind.headers
                setBOMData({bom: autofind.bom, bomAttrs: autofind.headers, apis: apis});
                setInterfaceState(2);
            }else{
                setInterfaceState(1);
            }
        }else{
            setInterfaceState(1);
        }
    };
    function autoFindMPN(bom, options={}){
        const searchMPN = ['mpn', 'manufacturing part number'];
        const searchQuantity = ['q', 'quantity'];
        if(bom.length > 0){
            const mpnCol = bom[0].findIndex((val) => {
                return (typeof val === 'string') 
                ? searchMPN.includes(val.toLowerCase()) 
                : false;
            });
            const qCol = bom[0].findIndex((val) => {
                return (typeof val === 'string') 
                ? searchQuantity.includes(val.toLowerCase()) 
                : false;
            });
            //const found = {mpn: mpnCol, quantity: qCol};
            if(mpnCol !== -1){
                const headers = [{Header: 'MPN', accessor: 'mpn'}];
                if(qCol !== -1) headers.push({Header:'Quantity', accessor: 'quantity'});
                bom.shift();
                const bomData = bom.map((line) => {
                    const data = {
                        mpn: line[mpnCol]
                    };
                    if(qCol !== -1){
                        data.quantity = line[qCol]
                    }
                    return data;
                });
                return {found: true, bom: bomData, headers: headers};
            }
        }
        return {found: false};
    }
    function handleEditBOM(bom, headers){
        //const hs = headers.concat(apis);
        const hs = headers;
        setBOMData({bom: bom, bomAttrs: hs, apis:apis});
        setInterfaceState(2);
    }
    function changeState(state, bom=[]){
        //setInitialUploadState(1);
        setInterfaceState(state);
        setInitialBOMEdit(bom);
    }
    //renders the body of interface depending on state
    function renderInterfaceState(){
        switch(interfaceState){
            case 0:
                return <BOMFileUploadInterface onBOMUpload={handleBOMUpload}/>;
            case 1:
                return <BOMEditInterface bom={uploadedBOM} onFinishEdit={handleEditBOM} changeState={changeState}/>
            case 2:
                return <BOMTool BOMData={BOMData} changeState={changeState}/>;
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
            <UploadIcon onClick={handleNavChange(0)} 
            selected={interfaceState===0} size={size}/>
            <EditIcon onClick={handleNavChange(1, [])} 
            selected={interfaceState===1} size={size}/>
            <SheetIcon onClick={handleNavChange(2)} 
            selected={interfaceState===2} size={size}/>
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