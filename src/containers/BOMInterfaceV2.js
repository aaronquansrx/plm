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
import BOMToolSettings from '../components/BOMToolSettings';

//import './../css/temp.css';
import './../css/bomtool.css';

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

const apiAttributes = [
    {Header: 'Stock', accessor: 'available'},
    {Header: 'MOQ', accessor: 'moq', longHeader: 'Minimum Order Quantity'},
    {Header: 'SPQ', accessor: 'spq', longHeader: 'Standard Pack Quantity'},
    {Header: 'Lead Time', accessor: 'leadtime'},
    {Header: 'Price', accessor: 'prices'},
    {Header: 'Exc. P', accessor: 'excessPrice', longHeader: 'Excess Price'},
    {Header: 'Adj. Q', accessor: 'adjustedQuantity', longHeader: 'Adjusted Quantity'},
    {Header: 'Exc. Q', accessor: 'excessQuantity', longHeader: 'Excess Quantity'},
    {Header: 'Packaging', accessor: 'packaging'}
]

function BOMInterface(props){
    const [uploadedBOM, setUploadedBOM] = useState([]); // bom uploaded from file upload interface
    const [BOMData, setBOMData] = useState({bom: [], attrs: [], apis: apis});
    const [loadData, setLoadData] = useState({bom_id: null, api_data: null});
    const [interfaceState, setInterfaceState] = useState(0);
    const [initialBOMEdit, setInitialBOMEdit] = useState([]);
    const [apiData, setApiData] = useState(new Map());

    const [settings, setSettings] = useState({apiAttributes: apiAttributes})

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
    function handleBomLoad(bom, headers, bom_id, api_data, has_saved_data){
        //setUploadedBOM(bom);
        //use bom id to load
        const tpString = has_saved_data ? 'saved' : 'saved_nodata';
        const obj = {bom: bom, attrs: headers, apis: apis, type: tpString};
        setLoadData({bom_id: bom_id, api_data: api_data});
        setBOMData(obj);
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
    function handleSaveSettings(apiAttrs){
        //console.log(apiAttrs);
        setSettings(update(settings, {
            apiAttributes: {$set: apiAttrs}
        }));
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
                return <BOMToolV3 bom={BOMData.bom} tableHeaders={BOMData.attrs} apis={BOMData.apis} apiAttrs={settings.apiAttributes}
                updateApiDataMap={updateApiDataMap} apiData={getApiData()} user={props.user}
                store={props.store} currency={props.currency} changeLock={props.changeLock}
                loadData={loadData} bomType={BOMData.type}/>;
            default:
                return "Unknown interface state";
        }
    }
    return ( 
        <>
            <Navigation interfaceState={interfaceState} settings={props.settings}
             onNavChange={changeState} onSaveSettings={handleSaveSettings}/>
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
            <div className='MainSwitchIcon'>
            <HoverOverlay tooltip={'Upload'} placement='bottom'>
            <UploadIcon onClick={handleNavChange(0)} 
            selected={interfaceState===0} size={size}/>
            </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
            <HoverOverlay tooltip={'Edit'} placement='bottom'>
            <EditIcon onClick={handleNavChange(1, [])} 
            selected={interfaceState===1} size={size}/>
            </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
            <HoverOverlay tooltip={'BOMTool'} placement='bottom'>
            <SheetIcon onClick={handleNavChange(2)} 
            selected={interfaceState===2} size={size}/>
            </HoverOverlay>
            </div>
            <div className='SettingsIcon'>
                <BOMToolSettings apiAttributes={apiAttributes} onSaveSettings={props.onSaveSettings}/>
            </div>
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