import {useState, useEffect, useRef} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import { HeaderArrayTable, PaginationHeaderTable, SearchPaginationTable } from '../../components/Tables';
import { ButtonChooseSearcher } from '../../components/Searcher';

//Manufacturer Master List
export function ManufacturerMasterReference(props){
    const [manuInputs, setManuInputs] = useState({manufacturer: '', string: ''});
    const [chosenManufacturer, setChosenManufacturer] = useState(null);
    const [manufacturerResults, setManufacturerResults] = useState([]);
    const [masterManufacturerData, setMasterManufacturerData] = useState([]);
    const [manufacturerMap, setManufacturerMap] = useState({});
    useEffect(() => {
        getManufacturers();
    }, []);
    const headers = [
        {label: 'Manufacturer', accessor: 'name'}, 
        {label: 'Website', accessor: 'website'}, 
        {label: 'Alias', accessor: 'string'}
    ];
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
    function handleDeselectManufacturer(){
        setChosenManufacturer(null);
        setManufacturerResults([]);
    }
    function handleAddManufacturer(){
        console.log(manuInputs);
        setManuInputs(update(manuInputs, {
            string: {$set: ''}
        }));
        const hasManufacturerString = manuInputs.manufacturer in manufacturerMap && 
        manufacturerMap[manuInputs.manufacturer].includes(manuInputs.string);
        if(!hasManufacturerString){
            /*
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
            */
        }
        if(chosenManufacturer && manuInputs.string !== ''){
            console.log(chosenManufacturer);
            //call new add reference
            const postData = {function: 'manufacturer_string_id', 
            id: chosenManufacturer.id, string: manuInputs.string}
            console.log(postData);
            postPLMRequest('srx_records', postData, (res) => {
                console.log(res.data);
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    function handleSearch(s){
        if(s !== ''){
            const getData = {
                function: 'search_manufacturer',
                search: s,
                limit: 5
            }
            getPLMRequest('srx_records', getData, 
            (res) => {
                console.log(res.data);
                setManufacturerResults(res.data.results);
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    function handleSelectManufacturer(i){
        console.log(i);
        setChosenManufacturer(manufacturerResults[i]);
        setManufacturerResults([]);
    }
    return (
        <>
        {/*<Button variant='secondary' onClick={handleBack}>Back</Button>*/}
        <div className='FlexNormal'>
            <span>Manufacturer</span>
            <ButtonChooseSearcher searchResults={manufacturerResults.map((r)=>r.name)} chosen={chosenManufacturer} 
            onDeselect={handleDeselectManufacturer} name={chosenManufacturer ? chosenManufacturer.name : ''}
            onClick={handleSelectManufacturer} onSearch={handleSearch}/>
            <Form>
                <Form.Label>Alias</Form.Label>
                <Form.Control type='text' value={manuInputs.string} onChange={handleChangeInputs('string')}/>
            </Form>
            <Button onClick={handleAddManufacturer}>Add Manufacturer</Button>
        </div>
        <SearchPaginationTable data={masterManufacturerData} headers={headers} 
        headerClass={'TableHeading'} searchField={'name'} fieldOptions={headers.map((h) => h.accessor)}/>
        </>
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
        <>
        <div className='FlexNormal'></div>
        <HeaderArrayTable data={supplierData} headers={headers}/>
        </>
    );
}

export function ManufacturerSupplierTable(props){
    const [tableData, setTableData] = useState([]);
    const [chosenManufacturer, setChosenManufacturer] = useState(null);
    const [chosenSupplier, setChosenSupplier] = useState(null);
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
    function handleSelectManufacturer(manu){
        setChosenManufacturer(manu);
    }
    function handleDeselectManufacturer(){
        setChosenManufacturer(null);
    }
    function handleSelectSupplier(supp){
        setChosenSupplier(supp);
    }
    function handleDeselectSupplier(){
        setChosenSupplier(null);
    }
    function addManufacturerSupplier(){
        if(chosenManufacturer !== null && chosenSupplier !== null){
            const postData = {function: 'add_manufacturer_supplier', manufacturer_id: chosenManufacturer.id, supplier_id: chosenSupplier.id};
            postPLMRequest('srx_records', postData, 
            (res) => {
                console.log(res.data);
                setTableData(res.data.results);
                setChosenManufacturer(null);
                setChosenSupplier(null);
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    const headers = [
        {label: 'Manufacturer', accessor: 'manufacturer_name'},
        {label: 'Supplier', accessor: 'supplier_name'}, 
        {label: 'Email', accessor: 'email'}
    ];
    return(
        <>
        <div className='FlexNormal'>
        <ManufacturerButtonChooser chosenManufacturer={chosenManufacturer}
        onDeselectManufacturer={handleDeselectManufacturer} onSelectManufacturer={handleSelectManufacturer}
        />
        <SupplierButtonChooser chosenSupplier={chosenSupplier}
        onDeselectSupplier={handleDeselectSupplier} onSelectSupplier={handleSelectSupplier}
        />
        <Button onClick={addManufacturerSupplier}>Add</Button>
        </div>
        <HeaderArrayTable data={tableData} headers={headers}/>
        </>
    );
}

function SupplierButtonChooser(props){
    const [supplierResults, setSupplierResults] = useState([]);
    function handleSearch(s){
        if(s !== ''){
            const getData = {
                function: 'search_supplier',
                search: s,
                limit: 5
            }
            getPLMRequest('srx_records', getData, 
            (res) => {
                console.log(res.data);
                setSupplierResults(res.data.results);
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    function handleSelectSupplier(i){
        console.log(i);
        //console.log(m);
        setSupplierResults([]);
        if(props.onSelectSupplier) props.onSelectSupplier(supplierResults[i]);
    }
    function handleDeselectSupplier(){
        setSupplierResults([]);
        if(props.onDeselectSupplier) props.onDeselectSupplier();
    }
    return(
        <>
        <span>Supplier</span>
        <ButtonChooseSearcher searchResults={supplierResults.map((r)=>r.name)} chosen={props.chosenSupplier} 
        onDeselect={handleDeselectSupplier} name={props.chosenSupplier ? props.chosenSupplier.name : ''}
        onClick={handleSelectSupplier} onSearch={handleSearch}/>
        </>
    );
}

function ManufacturerButtonChooser(props){
    const [manufacturerResults, setManufacturerResults] = useState([]);
    function handleSearch(s){
        if(s !== ''){
            const getData = {
                function: 'search_manufacturer',
                search: s,
                limit: 5
            }
            getPLMRequest('srx_records', getData, 
            (res) => {
                console.log(res.data);
                setManufacturerResults(res.data.results);
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    function handleSelectManufacturer(i){
        console.log(i);
        //console.log(m);
        setManufacturerResults([]);
        if(props.onSelectManufacturer) props.onSelectManufacturer(manufacturerResults[i]);
    }
    function handleDeselectManufacturer(){
        setManufacturerResults([]);
        if(props.onDeselectManufacturer) props.onDeselectManufacturer();
    }
    return(
        <>
        <span>Manufacturer</span>
        <ButtonChooseSearcher searchResults={manufacturerResults.map((r)=>r.name)} chosen={props.chosenManufacturer} 
        onDeselect={handleDeselectManufacturer} name={props.chosenManufacturer ? props.chosenManufacturer.name : ''}
        onClick={handleSelectManufacturer} onSearch={handleSearch}/>
        </>
    )
}