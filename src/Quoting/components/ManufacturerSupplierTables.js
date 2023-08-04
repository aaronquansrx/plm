import {useState, useEffect, useRef} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import { HeaderArrayTable, PaginationHeaderTable, SearchPaginationTable } from '../../components/Tables';
import { TabPages } from '../../components/Tabs';
import { ButtonChooseSearcher } from '../../components/Searcher';
import { DeleteModal, TemplateModal } from '../../components/Modals';


//to test
export function MasterManufacturers(props){
    const [masterManufacturerData, setMasterManufacturerData] = useState([]);
    const [deleteLine, setDeleteLine] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    useEffect(() => {
        getManufacturers();
    }, []);
    const headers = [{label: 'Manufacturer', accessor: 'name', editing: true}, 
    {label: 'Website', accessor: 'website', editing: true}];
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
    function updateDatas(data){
        setMasterManufacturerData(data.manufacturers);
    }
    function handleDelete(i){
        console.log(i);
        setDeleteLine(i);
        setDeleteModal(true);
    };
    function handleConfirmDelete(){
        const postData = {
            function: 'delete_master_manufacturer', 
            manufacturer_id: deleteLine.id,
        }
        postPLMRequest('srx_records', postData,
        (res) => {
            console.log(res.data);
            updateDatas(res.data);
        },
        (res) => {
            console.log(res.data);
        });
        setDeleteLine(null);
        setDeleteModal(false);
    }
    function handleClose(){
        setDeleteLine(null);
        setDeleteModal(false);
    }
    function handleEditCell(id, field, value){
        const postData = {
            function: 'update_srx_records',
            table: 'srx_manufacturer',
            field: field,
            value: value, id: id
        }
        postPLMRequest('srx_records', postData,
        (res) => {
            console.log(res.data);
            getManufacturers();
        },
        (res) => {
            console.log(res.data);
        });
    }
    return (
        <>
            <div className='FlexNormal'>
                <MasterManufacturerAdder updateData={updateDatas}/>
            </div>
            <SearchPaginationTable data={masterManufacturerData} headers={headers} 
            headerClass={'TableHeading'} searchField={'name'} fieldOptions={headers.map((h) => h.accessor)}
            searchName={'Search: '} delete={true} onDelete={handleDelete}
            onEditCell={handleEditCell} editing={true}/>
            {
            <TableDeleteLineModal show={deleteModal} title={'Delete Manufacturer Supplier'}
            onClose={handleClose} onConfirmDelete={handleConfirmDelete}
            manufacturer={deleteLine !== null && deleteLine.name}/>}
        </>
    );
}


//Manufacturer Master List
export function AlternateManufacturerReference(props){

    const [deleteLine, setDeleteLine] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [masterManufacturerData, setMasterManufacturerData] = useState([]);
    const [manufacturerMap, setManufacturerMap] = useState({});
    useEffect(() => {
        getManufacturers();
    }, []);
    const headers = [
        {label: 'Master Manufacturer', accessor: 'name', editing: false}, 
        {label: 'Website', accessor: 'website', editing: false}, 
        {label: 'Alternative Manufacturer Name', accessor: 'string', editing: true}
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
    function handleDelete(data){
        console.log(data);
        setDeleteLine(data);
        setDeleteModal(true);
        
    }
    function handleConfirmDelete(){
        const postData = {function: 'delete_alternative_manufacturer', alt_id: deleteLine.mrs_id};
        postPLMRequest('srx_records', postData, 
        (res) => {
            console.log(res.data);
            updateDatas(res.data);
        },
        (res) => {
            console.log(res.data);
        });
        handleClose();
    }
    function handleClose(){
        setDeleteLine(null);
        setDeleteModal(false);
    }
    function handleEditCell(id, field, value){
        const postData = {
            function: 'update_srx_records',
            table: 'srx_manufacturer_reference_string',
            field: field,
            value: value, id: id
        }
        postPLMRequest('srx_records', postData,
        (res) => {
            console.log(res.data);
            getManufacturers();
        },
        (res) => {
            console.log(res.data);
        });
    }
    return (
        <>
        <div className='FlexNormal'>
            <AlternateManufacturerAdder updateData={updateDatas}/>
        </div>
        <SearchPaginationTable data={masterManufacturerData} headers={headers} 
        headerClass={'TableHeading'} searchField={'name'} fieldOptions={headers.map((h) => h.accessor)}
        searchName={'Search: '} delete={true} onDelete={handleDelete}
        onEditCell={handleEditCell} editing={true}/>
        {<TableDeleteLineModal show={deleteModal} title={'Delete Manufacturer Supplier'}
        onClose={handleClose} onConfirmDelete={handleConfirmDelete}
        manufacturer={deleteLine !== null && deleteLine.name}
        string={deleteLine !== null && deleteLine.string}/>}
        </>
    );
}

export function MasterManufacturerAdder(props){
    const [addMasterInputs, setAddMasterInputs] = useState({name: '', website: ''});
    //const headers = [{label: 'Manufacturer', accessor: 'name'}, {label: 'Website', accessor: 'website'}];
    function handleAddMasterManufacturer(){
        const postData = {function: 'master_manufacturer', name: addMasterInputs.name, website: addMasterInputs.website};
        postPLMRequest('srx_records', postData,
        (res) => {
            console.log(res.data);
            //setMasterManufacturerData(res.data.manufacturers);
            const id = res.data.id;
            if(props.onAddManufacturer) props.onAddManufacturer(addMasterInputs, id);
            if(props.updateData) props.updateData(res.data);
        },
        (res) => {
            console.log(res.data);
        });
        setAddMasterInputs({
            name: '', website: ''
        });
    }
    function handleChangeMasterName(e){
        setAddMasterInputs(update(addMasterInputs, {
            name: {$set: e.target.value}
        }));
    }
    function handleChangeMasterWebsite(e){
        setAddMasterInputs(update(addMasterInputs, {
            website: {$set: e.target.value}
        }));
    }
    return(
        <>
        <Form className={'VerticalForm'}>
            <Form.Label>Manufacturer Name</Form.Label>
            <Form.Control type='text' value={addMasterInputs.name} onChange={handleChangeMasterName}/>
            <Form.Label>Website</Form.Label>
            <Form.Control type='text' value={addMasterInputs.website} onChange={handleChangeMasterWebsite}/>
        </Form>
        <Button onClick={handleAddMasterManufacturer}>Add</Button>
        </>
    );
}

export function AlternateManufacturerAdder(props){
    const [manuInputs, setManuInputs] = useState({manufacturer: '', string: props.alternateName ? props.alternateName : ''});
    const [chosenManufacturer, setChosenManufacturer] = useState(null);
    const [manufacturerResults, setManufacturerResults] = useState([]);
    //const [manufacturerMap, setManufacturerMap] = useState({});
    function handleChangeInputs(inp){
        return function(e){
            setManuInputs(update(manuInputs, {
                [inp]: {$set: e.target.value}
            }));
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
    function handleDeselectManufacturer(){
        setChosenManufacturer(null);
        setManufacturerResults([]);
    }
    function handleAddManufacturer(){
        //console.log(manuInputs);
        setManuInputs(update(manuInputs, {
            string: {$set: ''}
        }));
        //const hasManufacturerString = manuInputs.manufacturer in manufacturerMap && 
        //manufacturerMap[manuInputs.manufacturer].includes(manuInputs.string);
        if(chosenManufacturer && manuInputs.string !== ''){
            //call new add reference
            const postData = {function: 'manufacturer_string_id', 
            id: chosenManufacturer.id, string: manuInputs.string}
            console.log(postData);
            
            postPLMRequest('srx_records', postData, 
            (res) => {
                console.log(res.data);
                props.updateData(res.data);
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    function handleSelectManufacturer(i){
        setChosenManufacturer(manufacturerResults[i]);
        setManufacturerResults([]);
    }
    return(
        <>
        <div className='VerticalForm'>
        <span>Manufacturer</span>
        <ButtonChooseSearcher searchResults={manufacturerResults.map((r)=>r.name)} chosen={chosenManufacturer} 
        onDeselect={handleDeselectManufacturer} name={chosenManufacturer ? chosenManufacturer.name : ''}
        onClick={handleSelectManufacturer} onSearch={handleSearch}/>
        </div>
        <Form className={'VerticalForm'}>
            <Form.Label>Alternative Manufacturer Name</Form.Label>
            <Form.Control type='text' value={manuInputs.string} onChange={handleChangeInputs('string')}/>
        </Form>

        <Button onClick={handleAddManufacturer}>Add</Button>
        </>
    );
}

export function SupplierTable(props){
    const [supplierData, setSupplierData] = useState([]);
    const [addSupplier, setAddSupplier] = useState({name: '', phone: '', email: ''});
    const [deleteLine, setDeleteLine] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const hasData = useRef(false);
    useEffect(() => {
        if(!hasData.current){
            getSuppliers();
        }
    }, []);
    const headers = [
        {label: 'Supplier', accessor: 'name', editing: true}, 
        {label: 'Phone', accessor: 'phone', editing: true},
        {label: 'Email', accessor: 'email', editing: true}
    ];
    function getSuppliers(){
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
    function handleChangeSupplier(attr){
        return function(e){
            setAddSupplier(update(addSupplier, {
                [attr]: {$set: e.target.value}
            }));
        }
    }
    function handleAddSupplier(){
        const postData = {function: 'add_supplier'};
        Object.assign(postData, addSupplier);
        postPLMRequest('srx_records', postData, 
        (res) => {
            console.log(res.data);
            setSupplierData(res.data.suppliers);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleClose(){
        setDeleteLine(null);
        setDeleteModal(false);
    }
    function handleDelete(data){
        console.log(data);
        setDeleteLine(data);
        setDeleteModal(true);
    };
    function handleConfirmDelete(){
        const postData = {function: 'delete_supplier', supplier_id: deleteLine.id};
        postPLMRequest('srx_records', postData, 
        (res) => {
            console.log(res.data);
            setSupplierData(res.data.suppliers);
        },
        (res) => {
            console.log(res.data);
        });
        handleClose();
    }
    function handleEditCell(id, field, value){
        const postData = {
            function: 'update_srx_records',
            table: 'srx_supplier',
            field: field,
            value: value, id: id
        }
        postPLMRequest('srx_records', postData,
        (res) => {
            console.log(res.data);
            getSuppliers();
        },
        (res) => {
            console.log(res.data);
        });
    }
    return(
        <>
        <div className='FlexNormal'>
        <Form className={'VerticalForm'}>
            <Form.Label>Name</Form.Label>
            <Form.Control type='text' value={addSupplier.name} onChange={handleChangeSupplier('name')}/>
            <Form.Label>Phone</Form.Label>
            <Form.Control type='text' value={addSupplier.phone} onChange={handleChangeSupplier('phone')}/>
            <Form.Label>Email</Form.Label>
            <Form.Control type='text' value={addSupplier.email} onChange={handleChangeSupplier('email')}/>
        </Form>
        <Button onClick={handleAddSupplier}>Add</Button>
        </div>
        
        <SearchPaginationTable data={supplierData} headers={headers} 
            headerClass={'TableHeading'} searchField={'name'} fieldOptions={headers.map((h) => h.accessor)}
            searchName={'Search: '} delete={true} onDelete={handleDelete}
            onEditCell={handleEditCell} editing={true}/>
        <TableDeleteLineModal show={deleteModal} title={'Delete Manufacturer Supplier'}
        onClose={handleClose} onConfirmDelete={handleConfirmDelete}
        supplier={deleteLine !== null && deleteLine.name}/>
        </>
    );
}

export function ManufacturerSupplierTable(props){
    //console.log(props.region);
    const [tableData, setTableData] = useState([]);
    const [chosenManufacturer, setChosenManufacturer] = useState(null);
    const [chosenSupplier, setChosenSupplier] = useState(null);

    //const [page, setPage] = useState(0);

    const [deleteLine, setDeleteLine] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    useEffect(() => {
        getTableData();
    }, []);
    function getTableData(){
        const getData = {function: 'manufacturer_supplier', region: props.region};
        getPLMRequest('srx_records', getData, 
        (res) => {
            console.log(res.data);
            setTableData(res.data.results);
        },
        (res) => {
            console.log(res.data);
        });
    }
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
            const postData = {
                function: 'add_manufacturer_supplier', 
                manufacturer_id: chosenManufacturer.id, 
                supplier_id: chosenSupplier.id,
                region: props.region
            };
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
    function handleDelete(i){
        //console.log(i);
        //console.log(tableData[i]);
        setDeleteLine(i);
        setDeleteModal(true);
    };
    function handleConfirmDelete(){
        const postData = {
            function: 'delete_manufacturer_supplier', 
            manufacturer_id: deleteLine.manufacturer_id,
            supplier_id: deleteLine.supplier_id,
            region: props.region
        }
        postPLMRequest('srx_records', postData,
        (res) => {
            console.log(res.data);
            getTableData();
        },
        (res) => {
            console.log(res.data);
        });
        setDeleteLine(null);
        setDeleteModal(false);
    }
    function handleClose(){
        setDeleteLine(null);
        setDeleteModal(false);
    }
    const body = <>
        <div>Manufacturer: {deleteLine !== null && deleteLine.manufacturer_name}</div>
        <div>Supplier: {deleteLine !== null && deleteLine.supplier_name}</div>
    </>
    const footer = <>
        <Button onClick={handleConfirmDelete}>Confirm</Button>
        <Button onClick={handleClose} variant={'secondary'}>Cancel</Button>
    </>
    return(
        <>
        <div className='FlexNormal'>
            <div className='VerticalForm'>
            <ManufacturerButtonChooser chosenManufacturer={chosenManufacturer}
            onDeselectManufacturer={handleDeselectManufacturer} onSelectManufacturer={handleSelectManufacturer}
            />
            <SupplierButtonChooser chosenSupplier={chosenSupplier} name={'Supplier'}
            onDeselectSupplier={handleDeselectSupplier} onSelectSupplier={handleSelectSupplier}
            />
            <Button onClick={addManufacturerSupplier}>Add</Button>
            </div>
        </div>
        <SearchPaginationTable data={tableData} headers={headers} 
            headerClass={'TableHeading'} searchField={'manufacturer_name'} 
            fieldOptions={headers.map((h) => h.accessor)}
            searchName={'Search: '} 
            delete={true} onDelete={handleDelete}
            />
        {/*<TemplateModal show={deleteModal} title={'Delete Manufacturer Supplier'} 
        body={body} footer={footer} onClose={handleClose}/>*/}
        <TableDeleteLineModal show={deleteModal} title={'Delete Manufacturer Supplier'}
        onClose={handleClose} onConfirmDelete={handleConfirmDelete}
        manufacturer={deleteLine !== null && deleteLine.manufacturer_name}
        supplier={deleteLine !== null && deleteLine.supplier_name}/>
        </>
    );
}

export function TableDeleteLineModal(props){

    const body = <>
        {props.manufacturer && 
        <div>Manufacturer: {props.manufacturer}
        </div>}
        {props.supplier && <div>Supplier: {props.supplier}</div>}
        {props.string && <div>String: {props.string}</div>}
    </>
    const footer = <>
        <Button onClick={props.onConfirmDelete}>Confirm</Button>
        <Button onClick={props.onClose} variant={'secondary'}>Cancel</Button>
    </>
    return(
        <TemplateModal show={props.show} title={props.title} 
        body={body} footer={footer} onClose={props.onClose}/>
    )
}

export function SupplierButtonChooser(props){
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
        <span>{props.name}</span>
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