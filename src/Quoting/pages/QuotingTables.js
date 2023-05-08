import {useState, useEffect} from 'react';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import { TabPages } from '../../components/Tabs';
import { 
    MasterManufacturers, 
    AlternateManufacturerReference, 
    SupplierTable,
    ManufacturerSupplierTable
} from '../components/ManufacturerSupplierTables';

import '../../css/main.css';

function QuotingTables(props){
    const tabsContent = [
        {name: 'Master Manufacturer', content: <MasterManufacturers/>},
        {name: 'Alternative Manufacturer Names', content: <AlternateManufacturerReference/>},
        {name: 'Supplier', content: <SupplierTable/>},
        {name: 'Manufacturer Supplier Link AU', content: <TableAU/>},
        {name: 'Manufacturer Supplier Link MYR', content: <TableMYR/>}
    ];
    return(
        <>
        <TabPages tabs={tabsContent}/>
        </>
    );
}

function TableAU(props){
    return(
        <ManufacturerSupplierTable region='au'/>
    );
}

function TableMYR(props){
    return(
        <ManufacturerSupplierTable region='myr'/>
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