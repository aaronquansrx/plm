import {useState, useEffect} from 'react';

import update from 'immutability-helper';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';


import {UploadTable, UploadTableV2, UploadTableSingle} from '../components/UploadTable';
import {ExcelDropzone} from '../../components/Dropzone';
import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { excelSheetToArray } from '../../scripts/ExcelHelpers';

function QuoteView(props){
    console.log(props.user);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [highlightedProduct, setHighlightedProduct] = useState(null);
    const [pageState, setPageState] = useState({current:0, last: null});
    const [minBatches, setMinBatches] = useState(1);
    useEffect(() => {
        console.log(props.quote);
        //const getData = {function: 'get_products', quote_id: props.quote.id, user: props.user}
        const getData = {
            function: 'get_children', quote_id: props.quote.id, user: props.user
        }
        
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            setProducts(res.data.children);
            setMinBatches(res.data.num_batches);

        },
        (res) => {
            console.log(res.data);
        });
    }, []);
    function changeQuotePageState(i){
        setPageState(update(pageState, {
            current: {$set: i}
        }));
    }
    function handleEditQuote(){
        props.changePageState(4);
    }
    function handleBack(){
        props.changePageState(0);
    }
    function selectProduct(p){
        console.log(p);
        setSelectedProduct(p);
    }
    /*
    function handleAddProduct(){
        if(productName !== ''){
            const pd = {name: 'Product '+productName};
            setProductName('');
            const postData = {product_details: pd, function: 'add_product', user: props.user, quote_id:props.quoteId};
            postPLMRequest('quote', postData,
                (res) => {
                    console.log(res.data);
                    setProducts(res.data.products);
                },
                (res) => {
                    console.log('error');
                    console.log(res.data);
                }
            );
        }
    }*/

    function renderView(){
        switch(pageState.current){
            case 0:
                return <MainQuoteView quote={props.quote} setProducts={setProducts} products={products} user={props.user}
                changeMainPageState={props.changePageState} changeQuotePageState={changeQuotePageState} 
                selectProduct={selectProduct} minBatches={minBatches}/>
            case 1:
                return <UploadQuoteView products={products} quote={props.quote} user={props.user}
                setProducts={setProducts} changeQuotePageState={changeQuotePageState} product={selectedProduct}/>
            case 2:
                return <ViewProduct product={selectedProduct} changeQuotePageState={changeQuotePageState} 
                quote={props.quote} user={props.user}/>
        }
    }
    //console.log(props.quote);
    return(
        <>
            {renderView()}
        </>
    );
}

function MainQuoteView(props){
    const [highlightedProduct, setHighlightedProduct] = useState(null);
    const [parentProduct, setParentProduct] = useState(false);
    const [numBatches, setNumBatches] = useState(0);
    useEffect(() => {
        if(numBatches < props.minBatches){
            setNumBatches(props.minBatches);
        }
    }, [props.minBatches])
    //const 
    function handleEditQuote(){
        props.changeMainPageState(4);
    }
    function handleBack(){
        props.changeMainPageState(0);
    }
    function handleUpload(p){
        return function(){
            props.changeQuotePageState(1);
            props.selectProduct(p);
        }
    }
    function handleViewProduct(p){
        return function(){
            console.log(p);
            props.changeQuotePageState(2);
            props.selectProduct(p);
        }
    }
    function handleHighlightProduct(p){
        //return function(){
            //console.log(p);
        if(p === null){
            setHighlightedProduct(null);
        }else{
            console.log(p.id);
            if(p.id === highlightedProduct){
                //props.onHighlightProduct(p);
                setHighlightedProduct(null);
            }else{
                setHighlightedProduct(p.id);
            }
        }
        //}
    }
    //console.log(highlightedProduct);
    function displayTable(){
        switch(props.quote.structure){
            case 0:
                return <SubAssemblyProductTable products={props.products} onViewProduct={handleViewProduct} 
                onUpload={handleUpload} user={props.user}
                onHighlightProduct={handleHighlightProduct} highlightedProduct={highlightedProduct} numBatches={numBatches}/>
            case 1:
                return <MultipleProductTable products={props.products} onViewProduct={handleViewProduct} onUpload={handleUpload}/>
        }
    }
    function handleChangeBatches(e){
        //console.log(e.target.value);
        const val = parseInt(e.target.value);
        if(val > props.minBatches && val < 10){
            setNumBatches(val);
        }
    }
    return(
        <div className='Vert'>
            <div className='FlexNormal'>
            Customer BOM
            <Button variant="secondary" onClick={handleBack}>Quote List</Button>
            <Button onClick={handleEditQuote}>Edit Quote</Button>
            {/*<Button onClick={handleAddProduct}>Add Product</Button>*/}
            </div>
            <div>

            <div className='FlexNormal'>
                <div>
                <h3>{props.quote.formatted.rfq}</h3>
                <h5>Customer: {props.quote.formatted.customer}</h5>
                <h6>Owner: {props.quote.formatted.owner}</h6>
                <div>
                    {
                    props.quote.structure === 0 ? 
                        <div>
                            Product Sub-assembly 
                            Parent: {/*<Form.Control type={'text'} onChange={handleProductNameChange} value={productName}/>*/}
                            Batch1: x, EAU: x
                        </div>
                        : <div>
                            Multiple Products
                        </div>
                    }
                    <Form.Control style={{width:'100px'}} type='number' value={numBatches} onChange={handleChangeBatches}/>
                </div>
                </div>
            </div>
            <h3>{props.quote.structure === 0 && 'Child'} Products</h3>
            {displayTable()}

            {/*props.products.map((p, i) => {

                return <div key={i}>
                    {p.name} {p.has_sheet ? <Button onClick={handleViewProduct(p)}>View</Button> : 
                    <Button variant='danger' onClick={handleUpload(p)}>No Sheet</Button>}
                    </div>
            })*/}
            <ProductAdder setProducts={props.setProducts} user={props.user} quoteId={props.quote.id} 
            highlightedProduct={highlightedProduct}/>
            </div>
            <Button onClick={handleUpload}>Upload</Button>
        </div>
    );
}

function ProductRow(props){
    const p = props.product;
    //console.log(p.batches);
    const [batches, setBatches] = useState(p.batches);
    const [edit, setEdit] = useState(false);
    const [name, setName] = useState(p.name);
    const [qty, setQty] = useState(p.qty ? p.qty : undefined);
    const [eau, setEau] = useState(p.eau ? p.eau : undefined);
    useEffect(() => {
        //setBatches(props.batchesArr.map(() => undefined));
    }, [props.batchesArr]);
    function handleChangeBatchValue(i){
        return function(e){
            if(!isNaN(e.target.value)){
                const val = parseInt(e.target.value);
                setBatches(update(batches, {
                    [i]: {$set: val}
                }));
            }
        }
    }
    function handleChangeQty(e){
        if(!isNaN(e.target.value)){
            const val = parseInt(e.target.value);
            setQty(val)
        }
    }
    function handleChangeEau(e){
        if(!isNaN(e.target.value)){
            const val = parseInt(e.target.value);
            setEau(val)
        }
    }
    function handleChangeName(e){
        setName(e.target.value);
    }
    function handleToggleEdit(){
        //props.onHighlightProduct(null);
        setEdit(!edit);
    }
    function handleSave(){
        console.log(batches);
        handleToggleEdit();

        const bd = {
            name: name,
            eau: eau,
            qty: qty,
            batches: batches
        }
        //console.log(p.id);
        const postData = {function: 'modify_batch', user: props.user, product_id: p.id, batch_details: bd};
        postPLMRequest('quote', postData,
        (res) => {
            console.log(res.data);
        },
        (res) => {
            console.log(res.data);
        }
        );
    }
    function handleHighlightProduct(e){
        //console.log(e.target.id);
        if(!edit && e.target.id !== 'edit') props.onHighlightProduct(p);
    }
    return(
        <>
        <tr className={props.cn} onClick={handleHighlightProduct}>
            <td>{props.idValue}</td>
            <td>{edit ? <Form.Control type='text' value={name} onChange={handleChangeName}/> : name}</td>
            <td>
                {p.has_sheet ? <Button onClick={props.onViewProduct(p)}>View</Button> : 
                <Button variant='danger' onClick={props.onUpload(p)}>No Sheet</Button>}
            </td>
            <td>
            {edit ? <Form.Control type='text' value={qty !== undefined ? qty : ''} onChange={handleChangeQty}/> : qty ? qty : ''}
            </td>
            {props.batchesArr.map((n) => {
                return <td key={n}>
                    {edit ? <Form.Control type='text' value={batches[n] !== undefined ? batches[n] : ''} 
                    onChange={handleChangeBatchValue(n)}/> : batches[n] ? batches[n] : ''}
                </td>
            })}
            <td>
            {edit ? <Form.Control type='text' value={eau !== undefined ? eau : ''} onChange={handleChangeEau}/> : eau ? eau : ''}
            </td>
            <td>
                {edit ? <Button onClick={handleSave} id='edit'>Save</Button> : <Button variant='success' id='edit' onClick={handleToggleEdit}>Edit</Button>}
            </td>
        </tr>
        {props.children && props.children.map((child, i) => {
            //console.log(child);
            return <ProductRow key={i} onHighlightProduct={props.onHighlightProduct} onViewProduct={props.onViewProduct}
            onUpload={props.onUpload} batchesArr={props.batchesArr} user={props.user} {...child}/>
        })}
        </>
    );
}

function SubAssemblyProductTable(props){
    const batchesArr = [...Array(props.numBatches).keys()];
    //console.log(batchesArr);
    return(
        <Table>
        <thead>
        <tr>
            <th>Id</th><th>Name</th><th>Status</th><th>Qty</th>
            {batchesArr.map((n) => <th key={n}>Batch {n}</th>)}
            <th>EAU</th>
            <th>Edit</th>
        </tr>
        </thead>
        <tbody>
        {props.products.map((c, i) => {
            const p = c.product;
            //let childs = c;
            const cn = p.id === props.highlightedProduct ? 'HighlightedRow' : '';

            const childs = c.children.map((child, i) => {
                return {child: child, id: [i]}
            });
            let childrenRows = [];
            while(childs.length > 0){
                const c = childs.shift();
                const child = c.child;
                const cn = child.product.id === props.highlightedProduct ? 'HighlightedRow' : '';
                //const P = <ProductRow onHighlightProduct={props.onHighlightProduct} onViewProduct={props.onViewProduct}
                //onUpload={props.onUpload} />
                //console.log(child);
                child.children.forEach((ch, i) => {
                    childs.push({child: ch, id: c.id.concat([i])});
                })
                //console.log(c.id);
                const idStr = c.id.reduce((str, ind) => {
                    return str+' '+ind
                }, '');
                childrenRows.push({product: child.product, cn:cn, idValue: 'Child'+idStr});
                //childs.
                //console.log(c);
                //childs = childs.children;
            }
            return (<ProductRow key={i} user={props.user} onHighlightProduct={props.onHighlightProduct} onViewProduct={props.onViewProduct}
                onUpload={props.onUpload} product={p} cn={cn} idValue={'Parent '+i.toString()} batchesArr={batchesArr} children={childrenRows}/>);
        })}
        </tbody>
        </Table>
    );
}
function MultipleProductTable(props){
    return(
        <Table>
        <thead>
        <tr>
            <th>Name</th><th>Status</th><th>Batch 1</th><th>Batch N</th><th>EAU</th>
        </tr>
        </thead>
        <tbody>
        {props.products.map((p, i) => {
            return (
            <tr key={i}>
                <td>{p.name}</td>
                <td>
                    {p.has_sheet ? <Button onClick={props.onViewProduct(p)}>View</Button> : 
                    <Button variant='danger' onClick={props.onUpload(p)}>No Sheet</Button>}
                </td>
                <td>x</td><td>x</td>
                <td>
                    x
                </td>
            </tr>
            )
        })}
        </tbody>
        </Table>
    );
}

const productSheetHeaders = [
    {label: 'Level', accessor: 'level'},
    {label: 'Commodity', accessor: 'commodity'},
    {label: 'CMs', accessor: 'cms'},
    {label: 'Item No.', accessor: 'item_no'}, 
    {label: 'CPN', accessor: 'cpn'},
    {label: 'SRX PN', accessor: 'srx_pn'},
    {label: 'Description', accessor: 'description'},
    {label: 'Usage Per', accessor: 'usage_per'},
    {label: 'UOM', accessor: 'uom'},
    {label: 'Designator', accessor: 'designator'},
    {label: 'Approved MFR', accessor: 'mfr'},
    {label: 'Approved MPN', accessor: 'mpn'},
    {label: 'Supplier 1', accessor: 'supplier'},
    {label: 'Supplier Part Number 1', accessor: 'spn'},
    {label: 'Value', accessor: 'value'},
    {label: 'Footprint', accessor: 'footprint'},
    {label: 'Fitted', accessor: 'fitted'},
    {label: 'Notes', accessor: 'notes'},
    {label: 'Comments', accessor: 'comments'},
    {label: 'Batch Qty', accessor: 'batch_qty'}
];

function UploadQuoteView(props){
    const [sheets, setSheets] = useState(null);
    function handleBack(){
        props.changeQuotePageState(0);
    }
    function handleDrop(wb, file){
        console.log(wb);
        const sheetNames = wb.SheetNames;
        const sheets = sheetNames.map((sn) => {
            const sheetArray = excelSheetToArray(wb.Sheets[sn]);
            return {name: sn, array: sheetArray};
        });
        setSheets(sheets);
    }
    console.log(props.quote);
    return(
        <>
            <div className='FlexNormal'>
            <Button variant='secondary' onClick={handleBack}>Back</Button>
            <ExcelDropzone class='DropFiles' onDrop={handleDrop}>
                <p>Upload</p>
            </ExcelDropzone>
            </div>
            <div className='FlexNormal'>
            {/*<ProductAdder setProducts={props.setProducts} user={props.user} quoteId={props.quote.id}/>*/}
            </div>
            <UploadTableSingle sheets={sheets} productSheetHeaders={productSheetHeaders} user={props.user}
            products={props.products} setProducts={props.setProducts} quoteId={props.quote.id}
            product={props.product} changeQuotePageState={props.changeQuotePageState}/>
        </>
    );
}

function ProductAdder(props){
    const [productName, setProductName] = useState('');
    const [errorTool, setErrorTool] = useState(null);
    function handleAddProduct(){
        if(productName !== ''){
            let pd;
            if(props.highlightedProduct){
                pd = {type: 'product', details: {name: productName}, parent_type:'product', child_type: 'product', 
                parent: props.highlightedProduct};
            }else{
                pd = {type: 'product', details: {name: productName}, parent_type:'quote', child_type: 'product'};
            }
            console.log(pd);
            const postData = {child_details: pd, function: 'add_child', user: props.user, quote_id:props.quoteId};
            postPLMRequest('quote', postData,
                (res) => {
                    console.log(res.data);
                    props.setProducts(res.data.products)
                },
                (res) => {
                    console.log(res.data);
                },
            );
            setProductName('');
        }
    }
    function handleProductNameChange(e){
        setProductName(e.target.value);
    }
    return (
        <div className='Hori'>
            <div>Product Name:</div>
            <Form.Control type={'text'} onChange={handleProductNameChange} value={productName}/>
            <Button onClick={handleAddProduct}>Add Product</Button>
        </div>
    );
}

function ViewProduct(props){
    const [productSheet, setProductSheet] = useState(null);
    useEffect(() => {
        const getData = {function: 'get_product_sheet', user: props.user, product_id: props.product.id};
        getPLMRequest('quote', getData,
            (res) => {
                console.log(res.data);
                //props.setProducts(res.data.products);
                if(res.data.success){
                    setProductSheet(res.data.product_sheet);
                }
            },
            (res) => {
                console.log('error');
                console.log(res.data);
            }
        );
    }, [props.product]);
    function handleBack(){
        props.changeQuotePageState(0);
    }
    return(
        <div>
        <Button variant='secondary' onClick={handleBack}>Back to Quote</Button>
        <h3>{props.product.name}</h3>
        {productSheet &&
        <Table>
        <thead>
            <tr>
            {productSheetHeaders.map((h, i) => <td key={i}>{h.label}</td>)}
            </tr>
        </thead>
        <tbody>
        {productSheet.map((l, j) => {
            return <tr key={j}>
                {productSheetHeaders.map((h, i) => {
                    return <td key={i}>{l[h.accessor]}</td>
                })}
            </tr>
        })}
        </tbody>
        </Table>
        }
        </div>
    );
}

function AddProductModal(props){
    const [name, setName] = useState('');
    function handleChange(e){
        setName();
        if(props.onChange) props.onChange(e.target.value, props.formId)
    }
    return(
        <Modal>
            <Modal.Header closeButton={true}>
                <Modal.Title>Add Products</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form.Control type={'text'} onChange={handleChange} value={props.value}/>
            </Modal.Body>

            <Modal.Footer>
                {/*<Button addProduct>Add Product</Button>*/}
            </Modal.Footer>
        </Modal>
    )
}

export default QuoteView;