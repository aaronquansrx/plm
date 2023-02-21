import {useState, useEffect} from 'react';
import update from 'immutability-helper';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';

import { ExcelDropzone } from '../../components/Dropzone';
import {TemplateModal} from '../../components/Modals';

import { excelSheetToArray } from '../../scripts/ExcelHelpers';
import { useMousePosition } from '../../hooks/Mouse';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { TabbedSheetTable } from '../../components/Tables';

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
    easyFormElement('customer_disclose', 'Can end customer’s name be disclosed to suppliers?', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('customer_sell', 'Customer’s target sell price', 'select', yesNoOpt[0], {options: yesNoOpt}),
    easyFormElement('comments', 'Comments', 'textarea', '')
];

/*
function CreateQuote(props){
    const [formValues, setFormValues] = useState(formIdValueObject(quoteFormFields));
    const [productInformationValues, setProductInformationValues] = useState(formIdValueObject(productInformationFields));

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
    function handleProductInfoChanges(value, fid){
        setProductInformationValues(update(productInformationValues, {
            [fid]: {$set: value}
        }));
    }
    function handleCancel(){
        props.changePageState(0);
    }
    function handleSubmit(){
        console.log(formValues);
        console.log(productInformationValues);
        const postData = {create_details: formValues, function: 'create', user: props.user};
        if(props.user){   
            postPLMRequest('quote', postData,
            (res) => {
                console.log(res.data);
                props.toCustomerBom(res.data.quote_id, res.data.quote); // add qid
            },
            (res) => {
                console.log('error');
                console.log(res);
            }
            );
        }
    }
    function quoteValueSection(title){
        return (<div style={{marginBottom: '15px', margin: '10px'}}>
            {title}
            <Form>

            </Form>
        </div>);
    }
    return(
        <div>
            <div style={{marginBottom: '15px', margin: '10px'}}>
                <h3>Create Quote</h3>
                <Form>
                {quoteFormFields.map((e, i) => 
                    <FlexFormGroup key={i} {...e} value={formValues[e.formId]} onChange={handleFormChange}/>
                )}
                </Form>
            </div>
            <div>
                <h4>Product Information</h4>
                <Form>
                {productInformationFields.map((e, i) => 
                    <FlexFormGroup key={i} {...e} onChange={handleProductInfoChanges}/>
                )}
                </Form>
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
            <Button variant={'secondary'} onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit</Button>
        </div>
    )
}*/

export function CreateQuote(props){
    return(
        <ChangeQuoteTemplate title={'Create Quote'} changePageState={props.changePageState} 
        user={props.user} lastPageState={props.lastPageState} onCreateQuote={props.onCreateQuote} setQuotes={props.setQuotes}/>
    );
}

export function EditQuote(props){
    console.log(props.quote);
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
        console.log(formValues);
        console.log(productInformationValues);
        const postData = {create_details: formValues, function: 'create', user: props.user};
        if(props.user){   
            postPLMRequest('quote', postData,
            (res) => {
                if(res.data.success){
                    console.log(res.data);
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
                console.log('error');
                console.log(res.data);
            }
            );
        }
    }
    //to use
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
    //console.log(formValues.structure);
    return(
        <div>
            <UploadModal show={showUploadForm} onClose={handleUploadClose}/>
            <h3>Create Quote</h3> <Button onClick={handleUpload}>Upload</Button>
            {/*<Form>
            <FormIndexSelect formId='structure' value={formValues.structure.value} label='Structure' 
            options={structureField.extras.options} onChange={handleStructureChange}/>
            </Form>*/}
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
                {/*
                <h4>Product Information</h4>
                <Form>
                {productInformationFields.map((e, i) => 
                    <FlexFormGroup key={i} {...e} onChange={handleProductInfoChanges}/>
                )}
                </Form>*/}
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
            <Button variant={'secondary'} onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit</Button>
        </div>
    )
}

const fieldUploadButtons = quoteFormFieldsRight.concat(quoteFormFieldsLeft).map((v) => v.label);


function UploadModal(props){
    const [sheets, setSheets] = useState(null);
    const [formLabels, setFormLabels] = useState(fieldUploadButtons);
    const [labelsUsed, setLabelsUsed] = useState(new Set());
    const [isButtonDropped, setIsButtonDropped] = useState(false);
    const [chosenButton, setChosenButton] = useState(null)
    const [sheetValues, setSheetValues] = useState([]);
    const [sheetId, setSheetId] = useState(null);
    useEffect(() => {
        if(sheets === null) {
            setSheetValues([]);
        }else{
            setSheetValues(sheets.map((sheet) => {
                return sheet.array.map((r) => r.map(() => null));
            }));
            setSheetId(0);
        }
    }, [sheets]);
    function handleChangeSheet(i){
        setSheetId(i);
    }
    function handleFileDrop(wb, file){
        const sheetNames = wb.SheetNames;
        console.log(wb);
        const sheets = sheetNames.map((sn) => {
            const sheetArray = excelSheetToArray(wb.Sheets[sn]);
            return {name: sn, array: sheetArray};
        });
        setSheets(sheets);
    }
    function handleHoldButton(b){
        //console.log(b);
        const newLabels = formLabels.filter(e => e !== b);
        setFormLabels(newLabels);
        setChosenButton(b);
        setIsButtonDropped(false);
    }
    function handleDropButton(b){
        setIsButtonDropped(true);
        //setChosenButton(null);
        setFormLabels(fieldUploadButtons.filter((e => !labelsUsed.has(e))));
        setTimeout(() => {
            //setIsButtonDropped(false);
            //setFormLabels(fieldUploadButtons.filter((e => !labelsUsed.has(e))));
        }, 10);
    }
    function handleChosen(x, y){
        if(isButtonDropped){
            console.log('x: '+x+', y: '+y);
            console.log(chosenButton);
            setIsButtonDropped(false);
            setSheetValues(update(sheetValues, {
                [sheetId]: {
                    [y]: {
                        [x]: {$set: chosenButton}
                    }
                }
            }));
            const newLabelsUsed = update(labelsUsed, {
                $add: [chosenButton]
            })
            setLabelsUsed(newLabelsUsed);
            setFormLabels(fieldUploadButtons.filter((e => !newLabelsUsed.has(e))));
            setChosenButton(null);
        }
    }
    const body = <div>
        <ExcelDropzone class='DropFiles' onDrop={handleFileDrop}>
            <p>Upload</p>
        </ExcelDropzone>
        <DragButtonGroup buttons={formLabels} selectedButton={chosenButton}
        onDrop={handleDropButton} 
        onHold={handleHoldButton}/>
        <TabbedSheetTable sheets={sheets} sheetId={sheetId} onChangeSheet={handleChangeSheet} tableProps={{sheetValues:sheetValues}} table={(props) => 
            <TestTable {...props} isDropped={isButtonDropped} onChosen={handleChosen} chosenButton={chosenButton}
            />
        }/>
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
    const [selectedButton, setSelectedButton] = useState(null);
    //const [mouse, setMouse] = useState({x: 0, y: 0});
    const [buttonMousePos, setButtonMousePos] = useState(0);
    function deselectButton(){
        if(props.onDrop()) props.onDrop();
        setSelectedButton(null);
    }
    useEffect(() => {
        window.addEventListener('mouseup', deselectButton);
        return () => {
            window.removeEventListener('mouseup', deselectButton);
        }
    }, []);
    const mouse = useMousePosition();
    function handleHoldButton(i){
        return function(e){
            if(props.onHold) props.onHold(props.buttons[i]);
            setSelectedButton(props.buttons[i]);
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
        <div>
            {selectedButton && 
                <Button onClick={() => console.log('Ghost')}
                style={sty} 
                >{selectedButton}</Button>
            }
            {props.buttons.map((but, i) => {
                return <Button key={i} onMouseDown={handleHoldButton(i)}>{but}</Button>
            })}
        </div>
    );
}

function TestTable(props){
    //console.log(props);
    //const [cellClasses, setCellClasses] = useState([]);
    //const [cellHoverValues, setHoverValues] = useState([]);
    const sheetValues = props.index !== null ? props.sheetValues[props.index] : [];
    //console.log(sheetValues);
    useEffect(() => {
        /*
        setCellClasses(props.sheet.map((row) => {
            return row.map(() => null);
        }));
        setHoverValues(props.sheet.map((row) => {
            return row.map(() => null);
        }));*/
    }, [props.sheet])
    function handleHover(e){
        //if(props.isDropped){
        const spId = e.target.id.split(':');

        const x = parseInt(spId[0]), y = parseInt(spId[1]);
        //console.log('x: '+x+', y: '+y);
        /*
        setHoverValues(update(hoverValues, {
            [y]: {
                [x]: {$set: 'HL'}
            }
        }));
        */
        props.onChosen(x, y, props.chosenButton);
        //}
    }
    function handleClick(e){
        console.log(e.target.id);
    }   
    return(
        <Table>
            <tbody>
            {props.sheet.map((row, i) => {
                return <tr key={i}>
                    {row.map((col, j) => {
                        //const cn = (cellClasses.length > 0 && cellClasses[i][j]) ? cellClasses[i][j] : '';
                        //const cn = cellHoverValues.length > 0 && cellHoverValues[i][j] ? 'HL' : '';
                        const cn = sheetValues.length > 0 && sheetValues[i][j] !== null ? 'HL' : '';
                        return <td id={j+':'+i} key={j} className={cn} onClick={handleClick} onMouseOver={handleHover}>{col}</td>
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