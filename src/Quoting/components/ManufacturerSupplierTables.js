import {useState, useEffect, useRef} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import { HeaderArrayTable } from '../../components/Tables';

//Manufacturer Master List
export function ManufacturerMasterReference(props){
    const [manuInputs, setManuInputs] = useState({manufacturer: '', string: ''});
    const [masterManufacturerData, setMasterManufacturerData] = useState([]);
    const [manufacturerMap, setManufacturerMap] = useState({});
    useEffect(() => {
        getManufacturers();
    }, []);
    const headers = [{label: 'Manufacturer', accessor: 'name'}, {label: 'Alias', accessor: 'string'}];
    function handleBack(){
        props.changePageState(0);
    }
    function getManufacturers(){
        const getData = {function: 'manufacturer_string'};
        getPLMRequest('srx_records', getData, 
        (res) => {
            console.log(res.data);
            updateDatas(res.data);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function updateDatas(data){
        setMasterManufacturerData(data.manufacturer_master);
        setManufacturerMap(data.manufacturer_map);
    }
    function handleChangeInputs(inp){
        return function(e){
            setManuInputs(update(manuInputs, {
                [inp]: {$set: e.target.value}
            }));
        }
    }
    function handleAddManufacturer(){
        console.log(manuInputs);
        setManuInputs(update(manuInputs, {
            string: {$set: ''}
        }));
        const hasManufacturerString = manuInputs.manufacturer in manufacturerMap && 
        manufacturerMap[manuInputs.manufacturer].includes(manuInputs.string);
        if(!hasManufacturerString){
            const postData = {function: 'manufacturer_string', 
            details: {manufacturer: manuInputs.manufacturer, string: manuInputs.string}};
            postPLMRequest('srx_records', postData, 
            (res)=>{
                console.log(res.data);
                updateDatas(res.data);
            },
            (res)=>{
                console.log(res.data);
            });
        }
    }
    return (
        <div>
        {/*<Button variant='secondary' onClick={handleBack}>Back</Button>*/}
        <HeaderArrayTable data={masterManufacturerData} headers={headers}/>
        <Form>
            <Form.Label>Manufacturer</Form.Label>
            <Form.Control type='text' value={manuInputs.manufacturer} onChange={handleChangeInputs('manufacturer')}/>
        </Form>
        <Form>
            <Form.Label>Alias</Form.Label>
            <Form.Control type='text' value={manuInputs.string} onChange={handleChangeInputs('string')}/>
        </Form>
        <Button onClick={handleAddManufacturer}>Add Manufacturer</Button>
        </div>
    );
}

export function MasterManufacturers(props){
    const [masterManufacturerData, setMasterManufacturerData] = useState([]);
    useEffect(() => {
        getManufacturers();
    }, []);
    const headers = [{label: 'Manufacturer', accessor: 'name'}, {label: 'Website', accessor: 'website'}];
    function getManufacturers(){
        const getData = {function: 'master_manufacturer'};
        getPLMRequest('srx_records', getData, 
        (res) => {
            console.log(res.data);
            setMasterManufacturerData(res.data.manufacturers);
        },
        (res) => {
            console.log(res.data);
        });
    }
    return (
        <HeaderArrayTable data={masterManufacturerData} headers={headers}/>
    );
}

export function SupplierTable(props){
    const [supplierData, setSupplierData] = useState([]);
    const hasData = useRef(false);
    useEffect(() => {
        if(!hasData.current){
            const getData = {function: 'suppliers'};
            getPLMRequest('srx_records', getData, 
            (res) => {
                console.log(res.data);
                setSupplierData(res.data.suppliers);
                hasData.current = true;
            },
            (res) => {
                console.log(res.data);
            });
        }
    }, []);
    const headers = [
        {label: 'Supplier', accessor: 'name'}, 
        {label: 'Phone', accessor: 'phone'},
        {label: 'Email', accessor: 'email'}
    ];
    return(
        <HeaderArrayTable data={supplierData} headers={headers}/>
    );
}

export function ManufacturerSupplierTable(props){
    const [tableData, setTableData] = useState([]);
    useEffect(() => {
        const getData = {function: 'manufacturer_supplier'};
        getPLMRequest('srx_records', getData, 
        (res) => {
            console.log(res.data);
            setTableData(res.data.results);
        },
        (res) => {
            console.log(res.data);
        });
    }, []);
    const headers = [
        {label: 'Manufacturer', accessor: 'manufacturer_name'},
        {label: 'Supplier', accessor: 'supplier_name'}, 
        {label: 'Email', accessor: 'email'}
    ];
    return(
        <HeaderArrayTable data={tableData} headers={headers}/>
    );
}