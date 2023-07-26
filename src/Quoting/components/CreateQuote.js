import {useState, useEffect, useRef} from 'react';
import update from 'immutability-helper';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';

import { ExcelDropzone } from '../../components/Dropzone';
import {TemplateModal} from '../../components/Modals';
import {ListSelectDropdown} from '../../components/Dropdown';

import { excelSheetToArray } from '../../scripts/ExcelHelpers';
import { useMousePosition } from '../../hooks/Mouse';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { TabbedSheetTable } from '../../components/Tables';
import { SimplePopover, HoverOverlay } from '../../components/Tooltips';
import { ListGroup } from 'react-bootstrap';

function easyFormElement(formId, label, type='text', value='', extras={}){
    return {formId:formId, label:label, type:type, ivalue: value, extras:extras};
}

const yesNoOpt = ['Yes', 'No'];

const currencies = ["USD","EUR","JPY","GBP","CHF","NZD","HKD","SGD","MYR","CNY","AUD"];

const quoteFormFieldsRight = [
    easyFormElement('rfq_number', 'RFQ Number', 'text', ''),
    easyFormElement('due_date', 'Due Date for submission', 'date', currentDateFormat('-')),
    easyFormElement('customer', 'Customer', 'text', ''),
    easyFormElement('description', 'Product Description', 'textarea', ''),
    easyFormElement('application', 'Application', 'text', ''),
    easyFormElement('volume_batchsize', 'Annual Volume & Delivery Batch Sizes', 'textarea', ''),
    easyFormElement('currency', 'Currency to quote in', 'select', currencies[0], {options: currencies}),
];

const quoteFormFieldsLeft = [
    easyFormElement('initiated_by', 'Initiated by', 'text', ''),
    easyFormElement('quote_scope', 'Scope of Quote', 'text'),
    easyFormElement('sourcing_strategy', 'Primary Sourcing Strategy', 'text', ''),
    easyFormElement('quotation_type', 'Type of Quotation'),
    easyFormElement('product_lifecycle', 'Product Life Cycle'),
    easyFormElement('srx_experience', 'SRXs Experience with Product'),
    easyFormElement('manufacturing_location', 'Manufacturing Plant Location'),
    easyFormElement('design_location', 'Design Location')

];

const productInformationFields = [
    easyFormElement('bom', 'Bill of Materials complete with component references', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('avl', 'AVL (Approved Vendor List) with Manufacturer Part Numbers', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('savl_open', 'Strict AVL or open source', 'select', 'Both', {options: ['Both', 'Strict AVL', 'Open Source']}),
    easyFormElement('loa', 'Letter of Authorisation (LOA) for customer-negotiated parts if any', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('pcb', 'PCB fabrication drawings (Gerber preferred)', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('mad', 'Mechanical assembly drawings', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('samples', 'Samples of completed boards / assemblies (if available)', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('tests', 'Test specifications and/or times for ICT, Burn In and FCT', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('eq_details', 'Details of any equipment to be consigned', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('programming', 'Programming requirement/specifications', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('sp_details', 'Details of special processes required eg. Conformal coating, underfilling, X-Ray, potting etc.', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('packaging_delivery', 'Packaging requirement and delivery terms', 'select', 'Standard', {options: ['Standard']}),
    easyFormElement('RoHS', 'RoHS Compliance (Y/N)', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('class', 'ISO and IPC 610 requirement (Class II or III)', 'select', 'Class II', {options: ['Class II', 'Class III']}),

    easyFormElement('comments', 'Comments', 'textarea', '')
];  

const additionalInformationFields = [
    easyFormElement('customer_disclose', 'Can end customer\'s name be disclosed to suppliers?', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('customer_sell', 'Customer\'s target sell price', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('comments', 'Comments', 'textarea', '')
];

export function CreateQuote(props){
    return(
        <ChangeQuoteTemplate title={'Create Quote'} changePageState={props.changePageState} 
        user={props.user} lastPageState={props.lastPageState} onCreateQuote={props.onCreateQuote} setQuotes={props.setQuotes}/>
    );
}

export function EditQuote(props){
    return(
        <ChangeQuoteTemplate title={'Edit Quote'} quoteId={props.quote.id} changePageState={props.changePageState} 
        user={props.user} lastPageState={props.lastPageState} setQuotes={props.setQuotes}/>
    );
}
const structureField = easyFormElement('structure', 'BOM Structure', 'select', 
    0, {options: ['Product with Multiple Sub-Assemblies', 'Multiple Products']});

function ChangeQuoteTemplate(props){
    //const [structure, setStructure] = useState({id: 0, value: structureField.extras.options[0]});
    const [formValues, setFormValues] = useState(mainFormInitial);
    const [productInformationValues, setProductInformationValues] = useState(formIdValueObject(productInformationFields));
    const [showUploadForm, setShowUploadForm] = useState(false);
    function mainFormInitial(){
        const leftFieldValues = formIdValueObject(quoteFormFieldsLeft);
        const rightFieldValues = formIdValueObject(quoteFormFieldsRight);
        return {...leftFieldValues, ...rightFieldValues, 
        structure: {id: 0, value: structureField.extras.options[0]}
        };
    }
    function formIdValueObject(fields){
        return fields.reduce((obj, f) => {
            obj[f.formId] = f.ivalue;
            return obj;
        }, {});
    }
    function handleFormChange(value, fid){
        setFormValues(update(formValues, {
            [fid]: {$set: value}
        }));
    }
    function handleStructureChange(value, fid){
        //setFormValues();
        setFormValues(update(formValues, {
            structure: {$set: value}
        }));
    }
    function handleProductInfoChanges(value, fid){
        setProductInformationValues(update(productInformationValues, {
            [fid]: {$set: value}
        }));
    }
    function handleCancel(){
        props.changePageState(props.lastPageState);
    }
    function handleSubmit(){
        const postData = {create_details: formValues, function: 'create', user: props.user};
        if(props.user){   
            postPLMRequest('quote', postData,
            (res) => {
                if(res.data.success){
                    //props.toCustomerBom(res.data.quote_id, res.data.quote); // add qid
                    if(!props.quoteId){ //creating quote
                        props.onCreateQuote(res.data.quote);
                    }else{
                        //editing existing
                    }
                    props.setQuotes(res.data.quotes);
                }
            },
            (res) => {
                console.log(res.data);
            }
            );
        }
    }
    function handleSubmitUploadDetails(uploadedDetails={}){
        setFormValues({...formValues, ...uploadedDetails});
    }
    function quoteValueSection(title, fields){
        return (<div style={{marginBottom: '15px', margin: '10px'}}>
            {title}
            <Form>
                {fields.map((e, i) => 
                    <FlexFormGroup key={i} {...e} value={formValues[e.formId]} onChange={handleFormChange}/>
                )}
            </Form>
        </div>);
    }
    function handleUpload(){
        setShowUploadForm(true);
    }
    function handleUploadClose(){
        setShowUploadForm(false);
    }
    return(
        <>
        <div className='FlexNormal' style={{overflow: 'auto'}}>
            <UploadModal show={showUploadForm} onClose={handleUploadClose} onSubmit={handleSubmitUploadDetails}/>
            <h3>Create Quote</h3> <Button onClick={handleUpload}>Upload</Button>
            <div style={{marginBottom: '15px', margin: '10px'}}>
                <div className='Hori'>
                    <div>
                    <Form>
                    {quoteFormFieldsLeft.map((e, i) => 
                        <FlexFormGroup key={i} {...e} value={formValues[e.formId]} onChange={handleFormChange}/>
                    )}
                    </Form>
                    </div>
                    <div>
                    <Form>
                    {quoteFormFieldsRight.map((e, i) => 
                        <FlexFormGroup key={i} {...e} value={formValues[e.formId]} onChange={handleFormChange}/>
                    )}
                    </Form>
                    </div>
                </div>
            </div>
            <div>
                {quoteValueSection(<h4>Product Information</h4>, productInformationFields)}
            </div>
            <div>
                <h5>Additional Information</h5>
                <Form>
                {additionalInformationFields.map((e, i) => 
                    <FlexFormGroup key={i} {...e} onChange={handleProductInfoChanges}/>
                )}
                </Form>
            </div>
            <div>
                <h4>SRX Internal</h4>
            </div>
        </div>
        <div className='BottomButtons'>
        <Button variant={'secondary'} onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Submit</Button>
        </div>
        </>
    )
}

const fieldUploadButtons = quoteFormFieldsRight.concat(quoteFormFieldsLeft).map((v) => {
    return {label: v.label, id: v.formId}
});
const uploadButtonIdLabelMap = fieldUploadButtons.reduce((obj, b) => {
    obj[b.id] = b.label;
    return obj;
}, {});

function UploadModal(props){
    const [sheets, setSheets] = useState(null);
    const [labelsUsed, setLabelsUsed] = useState(new Set());
    const [formLabels, setFormLabels] = useState(fieldUploadButtons);
    const [chosenButton, setChosenButton] = useState(null)
    const [sheetValues, setSheetValues] = useState([]);
    const [sheetId, setSheetId] = useState(null);

    const add = {id: null, name: 'add'};
    const [selectedTemplate, setSelectedTemplate] = useState(add);
    const [uploadTemplates, setUploadTemplates] = useState([]);
    const firstRender = useRef(true);

    const changeSheets = useRef(false);
    useEffect(() => {
        if(!firstRender.current && changeSheets.current){
            if(sheets === null) {
                setSheetValues([]);
            }else{
                setSheetValues(nullSheetValues());
                setSheetId(0);
            }
            changeSheets.current = false;
        }
        firstRender.current = false;
        //setFormLabels(fieldUploadButtons.filter((e => !labelsUsed.has(e.label))));
    }, [sheets]);
    useEffect(() => {
        const getData = {function: 'quote_detail'};
        getPLMRequest('templates', getData,
        (res) => {
            console.log(res.data);
            setUploadTemplates(res.data.templates);
        },
        (res) => {
            console.log(res.data);
        }
        );
    }, []);

    useEffect(() => {
        setFormLabels(fieldUploadButtons.filter((e => !labelsUsed.has(e.label))));
    }, [labelsUsed])

    function nullSheetValues(){
        if(sheets === null) return [];
        return sheets.map((sheet) => {
            return sheet.array.map((r) => r.map(() => null));
        });
    }
    function handleChangeSheet(i){
        setSheetId(i);
    }
    function handleFileDrop(wb, file){
        const sheetNames = wb.SheetNames;
        const sheets = sheetNames.map((sn) => {
            const sheetArray = excelSheetToArray(wb.Sheets[sn]);
            return {name: sn, array: sheetArray};
        });
        setSheets(sheets);
        changeSheets.current = true;
    }
    function handleHoldButton(b){
        const newLabels = formLabels.filter(e => e !== b);
        setFormLabels(newLabels);
        setChosenButton(b);
    }
    function handleDropButton(e){
        if(e.target.id === 'DropButton'){
            e.target.hidden = true;
            const eBelow = document.elementFromPoint(e.clientX, e.clientY);
            if(eBelow.id === 'DropCell'){
                const x = parseInt(eBelow.attributes.x.value), y = parseInt(eBelow.attributes.y.value);
                const labelUpdateObj = {
                    $add: [chosenButton.label]
                }
                if(sheetValues[sheetId][y][x] !== null){
                    labelUpdateObj.$remove = [sheetValues[sheetId][y][x].label];
                }
                setSheetValues(update(sheetValues, {
                    [sheetId]: {
                        [y]: {
                            [x]: {$set: chosenButton}
                        }
                    }
                }));
                const newLabels = update(labelsUsed, labelUpdateObj);
                setLabelsUsed(newLabels);
            }else{
                setFormLabels(newFormLabels());
            }
        }
        setChosenButton(null);
    }
    function newFormLabels(newLabels=null){
        const nl = newLabels ? newLabels : labelsUsed;
        return fieldUploadButtons.filter((e => !nl.has(e.label)));
    }
    function handleRemoveButton(e){
        const et = e.target;
        const x = parseInt(et.attributes.x.value), y = parseInt(et.attributes.y.value);
        const b = sheetValues[sheetId][y][x];
        setSheetValues(update(sheetValues, {
            [sheetId]: {
                [y]: {
                    [x]: {$set: null}
                }
            }
        }));
        const newLabels = update(labelsUsed, {
            $remove: [b.label]
        });
        setLabelsUsed(newLabels);
        setFormLabels(newFormLabels(newLabels));
    }
    function getFormValues(){
        return sheetValues.reduce((valObj, sheet, i) => {
            const sheetVals = sheet.reduce((rObj, row, y) => {
                const rowVals = row.reduce((cObj, col, x) => {
                    if(col !== null){
                        cObj.form[col.id] = sheets[i].array[y][x];
                        cObj.cells.push({assoc: col.id, sheetname: sheets[i].name, sheetid: i, x: x, y: y});
                    }
                    return cObj;
                }, {form: {}, cells: []});
                return {form: {...rObj.form, ...rowVals.form}, cells: rObj.cells.concat(rowVals.cells)};
            }, {form: {}, cells: []});
            return {form: {...valObj.form, ...sheetVals.form}, cells: valObj.cells.concat(sheetVals.cells)};
        }, {form: {}, cells: []});
    }
    function handleSaveTemplate(){
        const formValues = getFormValues();
        const td = {name: 'template'+uploadTemplates.length.toString(), cells: formValues.cells};
        const postData = {function: 'upload_quote_detail', template_details: td};
        postPLMRequest('templates', postData,
        (res) => {
            console.log(res.data);
            setUploadTemplates(res.data.templates);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleSelectTemplate(i){
        if(i === 0){
            setSelectedTemplate(add);
        }else{
            const temp = uploadTemplates[i-1];
            setSelectedTemplate(temp);
            const getData = {function: 'quote_detail_cells', template_id: temp.id};
            getPLMRequest('templates', getData,
            (res)=>{
                console.log(res.data);
                const newSheetValues = nullSheetValues();
                const newLabels = new Set();
                res.data.cells.forEach((cell) => {
                    if(cell.sheetid < newSheetValues.length){
                        //const sheet = 
                        if(cell.y < newSheetValues[cell.sheetid].length && cell.x < newSheetValues[cell.sheetid][cell.y].length){
                            const lab = uploadButtonIdLabelMap[cell.assoc];
                            const but = {label: lab, id: cell.assoc};
                            newSheetValues[cell.sheetid][cell.y][cell.x] = but;
                            newLabels.add(lab);
                        }
                    }
                });
                setSheetValues(newSheetValues);
                setLabelsUsed(newLabels);
                //setFormLabels(fieldUploadButtons.filter((e => !newLabels.has(e))));
            },
            (res)=>{
                console.log(res.data);
            });
        }
    }
    function handleSubmit(){
        //console.log(sheetValues);
        const formValues = getFormValues();
        if(props.onSubmit) props.onSubmit(formValues.form);
        props.onClose();
    }
    const body = <div className='ColumnFlexBox' style={{height: '87vh'}}>
        <div className='FlexNormal'>
        <ExcelDropzone class='DropFilesSmall' onDrop={handleFileDrop}>
            <p>Upload</p>
        </ExcelDropzone>
        </div>
        <div className='FlexNormal'>
            <div style={{display: 'flex', flexDirection:'row'}}>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
            <ListSelectDropdown items={[add].concat(uploadTemplates)} selected={selectedTemplate} onSelect={handleSelectTemplate}/>
            </div>
        </div>
        <div className='FlexNormal'>
        <DragButtonGroup buttons={formLabels} selectedButton={chosenButton}
        onDrop={handleDropButton} 
        onHold={handleHoldButton}/>
        </div>
        {sheets &&
        <TabbedSheetTable sheets={sheets} sheetId={sheetId} 
        onChangeSheet={handleChangeSheet} tableProps={{sheetValues:sheetValues}}
        tabsClass='FlexNormal' tableClass='FlexNormal Overflow'
        table={(props) => 
            <TestTable {...props}
            chosenButton={chosenButton} onRemove={handleRemoveButton}
            />
        }/>
        }
        <div className='FlexNormal' style={{}}>
            <Button onClick={handleSubmit}>Submit</Button>
        </div>
    </div>
    return(
        <TemplateModal show={props.show}
        onClose={props.onClose}
        title={"Upload Quote Details"}
        body={body}
        modalClass={'WideModal'}
        />
    );
}

function DragButtonGroup(props){
    const [buttonMousePos, setButtonMousePos] = useState(0);
    function deselectButton(e){
        if(props.onDrop) props.onDrop(e);
        //setSelectedButton(null);
    }
    useEffect(() => {
        //window.addEventListener('mouseup', deselectButton);
        return () => {
            //window.removeEventListener('mouseup', deselectButton);
        }
    }, []);
    const mouse = useMousePosition();
    function handleHoldButton(i){
        return function(e){
            if(props.onHold) props.onHold(props.buttons[i]);
            //setSelectedButton(props.buttons[i]);
            const mx = e.nativeEvent.offsetX;
            const my = e.nativeEvent.offsetY;
            setButtonMousePos({x: mx, y: my});
        }
    }
    const sty = {
        position: 'fixed', 
        top: (mouse.y-buttonMousePos.y).toString()+'px', 
        left: (mouse.x-buttonMousePos.x).toString()+'px'
    }
    return(
        <>
            {props.selectedButton && 
                <Button variant='info' id='DropButton' onMouseUp={deselectButton}
                style={sty} 
                >{props.selectedButton.label}</Button>
            }
            {props.buttons.map((but, i) => {
                return <Button variant='info' key={i} onMouseDown={handleHoldButton(i)}>{but.label}</Button>
            })}
        </>
    );
}

function TestTable(props){
    const sheetValues = props.index !== null ? props.sheetValues[props.index] : [];

    function handleRemove(e){
        props.onRemove(e);
    }   
    function Cell(p){
        return <>{p.sheetVal ? 
            <SimplePopover key={p.j} className={p.cn} popoverBody={p.sheetVal.label} trigger={['hover', 'focus']} placement='auto'>
                <td id={'DropCell'} x={p.j} y={p.i} key={p.j} className={p.cn} 
                onClick={handleRemove}>
                    {p.col}
                </td>
            </SimplePopover> :
            <td id={'DropCell'} x={p.j} y={p.i} key={p.j} className={p.cn}>{p.col}</td>
            }
        </>;
    }

    return(
        <Table>
            <tbody>
            {props.sheet.map((row, i) => {
                return <tr key={i}>
                    {row.map((col, j) => {
                        //const cn = (cellClasses.length > 0 && cellClasses[i][j]) ? cellClasses[i][j] : '';
                        //const cn = cellHoverValues.length > 0 && cellHoverValues[i][j] ? 'HL' : '';
                        const sheetVal = sheetValues && i < sheetValues.length && 
                        j < sheetValues[i].length && sheetValues[i][j] !== null ? sheetValues[i][j] : null;
                        const cn = sheetVal ? 'HL Pointer' : '';
                        //const inner = sheetVal ? <HoverOverlay popover={sheetVal} placement='auto'>{col}</HoverOverlay> : <>{col}</>
                        return <Cell key={j} i={i} j={j} cn={cn} sheetVal={sheetVal} col={col}/>

                    })}
                </tr>
            })}
            </tbody>
        </Table>
    )
}

function currentDateFormat(seperator='-'){
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return yyyy + seperator + mm + seperator + dd;
}


function FlexFormGroup(props){
    //const [val, setVal] = useState(null);
    function handleChange(e){
        //console.log(e.target.value);
        if(props.onChange) props.onChange(e.target.value, props.formId);
    }
    const t = props.type === 'textarea' ? 'textarea' : 'input';
    function form(){
        switch(props.type){
            case 'textarea':
                return <Form.Control as={'textarea'} onChange={handleChange} value={props.value} 
                rows={props.extras.rows ? props.extras.rows : 3}/>
            case 'text': 
                return <Form.Control type={'text'} onChange={handleChange} value={props.value}/>
            case 'select':
                const opts = props.extras.options;
                return <Form.Select value={props.value} onChange={handleChange}>
                    {opts && opts.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </Form.Select>
            case 'date':
                return <Form.Control type={'date'} onChange={handleChange} value={props.value}/>
        }

    }
    return(
        <Form.Group style={{marginBottom: '7px'}}>
            <Form.Label>{props.label}</Form.Label>
            {form()}
        </Form.Group>
    );
}

function FormIndexSelect(props){
    function handleChange(e){
        //console.log(e.target.value);
        //const sp = e.target.value.split(':');
        const v = {
            value: e.target.value,
            id: props.options.findIndex((op) => op === e.target.value)
        }
        if(props.onChange) props.onChange(v, props.formId);
    }
    //console.log(props.value);
    return(
        <Form.Group style={{marginBottom: '7px'}}>
            <Form.Label>{props.label}</Form.Label>
            <Form.Select value={props.value} onChange={handleChange}>
                {props.options.map((opt, i) => {
                    return <option key={i} value={opt}>{opt}</option>
                })}
            </Form.Select>
        </Form.Group>
    );
}