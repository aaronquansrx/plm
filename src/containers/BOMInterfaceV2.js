import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import BOMFileUploadInterface from '../components/BOMFileUploadInterface';
import BOMEditInterface from '../components/BOMEditInterface';
import BOMEditInterfaceV2 from '../components/BOMEditInterfaceV2';
import BOMTool from '../components/BOMTool';
import BOMToolV3 from '../components/BOMToolV3';
import {HoverOverlay} from '../components/Tooltips';
import {UploadIcon, EditIcon, SheetIcon} from '../components/Icons';
import {StoreCurrencyOptions} from '../components/Options';

import './../css/temp.css';

const interfaceStates = ['upload', 'edit', 'tool'];

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
    //{Header:'Custom', accessor: 'custom'}
];
const uploadHeaders = tableHeaders.reduce((arr, header, i) => {
    if(i !== 0){
        arr.push(header);
    }
    return arr;
}, []);

const headerOrder = [
    {Header:'Manufacturer Part Number', accessor: 'mpn'}, 
    {Header:'Quantity', accessor: 'quantity'}, {Header:'Manufacturer', accessor: 'manufacturer'},
    {Header: 'Internal Part Number', accessor: 'ipn'}, {Header: 'Customer Part Number', accessor: 'cpn'},
    {Header: 'Description', accessor: 'description'}, {Header: 'Reference Designator', accessor: 'reference'}
];

function BOMInterface(props){
    const [uploadedBOM, setUploadedBOM] = useState([]); // bom uploaded from file upload interface
    const [BOMData, setBOMData] = useState({bom: [], attrs: [], apis: apis});
    const [interfaceState, setInterfaceState] = useState(0);
    const [initialBOMEdit, setInitialBOMEdit] = useState([]);
    const [apiData, setApiData] = useState(new Map());

    function handleBOMUpload(bom, autoFind={found: false}){
        //assume first col is MPN
        setUploadedBOM(bom);
        if(autoFind.found){
            setBOMData({bom: autoFind.bom, attrs: autoFind.headers, apis: apis, type: 'auto_upload'});
            setInterfaceState(2);
        }else{
            setInterfaceState(1);
        }
    };
    function handleBomLoad(bom, headers){
        //setUploadedBOM(bom);
        setBOMData({bom: bom, attrs: headers, apis: apis, type: 'saved'});
        setInterfaceState(2);
    }
    function handleFinishEditBOM(bom, headers){
        setBOMData({bom: bom, attrs: headers, apis: apis, type: 'upload'});
        setInterfaceState(2);
    }
    function changeState(state, bom=[]){
        //setInitialUploadState(1);
        setInterfaceState(state);
        setInitialBOMEdit(bom);
    }
    const SCKey = props.store+':'+props.currency;
    function updateApiDataMap(joinMap){
        const addToData = getApiData();
        const newApiData = new Map([...addToData, ...joinMap]);
        setApiData(update(apiData, {
            $add: [[SCKey, newApiData]]
        }));
    }
    function getApiData(){
        return apiData.has(SCKey) ? apiData.get(SCKey) : new Map();
    }
    //renders the body of interface depending on state
    function renderInterfaceState(){
        switch(interfaceStates[interfaceState]){
            case 'upload':
                return <BOMFileUploadInterface user={props.user} onBOMUpload={handleBOMUpload} onBomLoad={handleBomLoad} 
                headers={uploadHeaders} headerOrder={headerOrder}/>;
            case 'edit':
                return <BOMEditInterfaceV2 bom={uploadedBOM} onFinishEdit={handleFinishEditBOM} 
                tableHeaders={tableHeaders} headerOrder={headerOrder}/>
                //return <BOMEditInterface bom={uploadedBOM} onFinishEdit={handleEditBOM} changeState={changeState} headers={tableHeaders}/>
            case 'tool':
                return <BOMToolV3 bom={BOMData.bom} tableHeaders={BOMData.attrs} apis={BOMData.apis} 
                updateApiDataMap={updateApiDataMap} apiData={getApiData()} user={props.user}
                store={props.store} currency={props.currency} changeLock={props.changeLock}/>;
            default:
                return "Unknown interface state";
        }
    }
    return ( 
        <>
            <Navigation interfaceState={interfaceState} onNavChange={changeState}/>
            {renderInterfaceState()}
        </>
    );
}

function Navigation(props){
    //renders the header for each interface mode
    const interfaceState = props.interfaceState;
    const size = 35;
    function handleNavChange(state, bom=[]){
        return function(){
            props.onNavChange(state, bom);
        }
    }
    return(
        <div className='FlexNormal'>
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
        </div>
    );
}

function Interface(){
    const stateComponentMap = {
        'upload': (p) => <></>
    }
}

export default BOMInterface;