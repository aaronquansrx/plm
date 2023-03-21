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
        {name: 'Manufacturer', content: <MasterManufacturers/>},
        {name: 'Manufacturer Reference Strings', content: <ManufacturerMasterReference/>},
        {name: 'Supplier', content: <SupplierTable/>},
        {name: 'Manufacturer Suppliers', content: <ManufacturerSupplierTable/>}
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