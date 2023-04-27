import {useState, useEffect} from 'react';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import { TabPages } from '../../components/Tabs';
import { 
    ManufacturerMasterReference, 
    ManufacturerSupplierTable, 
    MasterManufacturers, 
    SupplierTable 
} from '../components/ManufacturerSupplierTables';

import '../../css/main.css';

function QuotingTables(props){
    const tabsContent = [
        {name: 'Master Manufacturer', content: <MasterManufacturers/>},
        {name: 'Alternative Manufacturer Names', content: <ManufacturerMasterReference/>},
        {name: 'Supplier', content: <SupplierTable/>},
        {name: 'Manufacturer Supplier Link', content: <ManufacturerSupplierTable/>}
    ];
    return(
        <>
        <TabPages tabs={tabsContent}/>
        </>
    );
}
/*
function ManufacturerTable(props){
    return(
        <MasterManufacturers/>
    );
}

function ManuRefTable(props){
    return(
        <ManufacturerMasterList/>
    );
}*/
/*
function SupplierTable(props){
    return(
        <></>
    );
}*/
export default QuotingTables;