import {useState, useEffect} from 'react';
import update from 'immutability-helper';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

function easyFormElement(formId, label, type, extras={}){
    return {formId:formId, label:label, type:type, extras:extras};
}

const yesNoOpt = ['Yes', 'No'];

const currencies = ["USD","EUR","JPY","GBP","CHF","NZD","HKD","SGD","MYR","CNY","AUD"];

const quoteFormFields = [
    easyFormElement('customer', 'Customer', 'text'),
    easyFormElement('description', 'Product Description', 'textarea'),
    easyFormElement('application', 'Application', 'text'),
    easyFormElement('volume_batchsize', 'Annual Volume & Delivery Batch Sizes', 'textarea'),
    easyFormElement('currency', 'Currency to quote in', 'select', {options: currencies})
];

const productInformationFields = [
    easyFormElement('bom', 'Bill of Materials complete with component references', 'select', {options: yesNoOpt}),
    easyFormElement('avl', 'AVL (Approved Vendor List) with Manufacturer Part Numbers', 'select', {options: yesNoOpt}),
    easyFormElement('savl_open', 'Strict AVL or open source', 'select', {options: ['Both', 'Strict AVL', 'Open Source']}),
    easyFormElement('loa', 'Letter of Authorisation (LOA) for customer-negotiated parts if any', 'select', {options: yesNoOpt}),
    easyFormElement('pcb', 'PCB fabrication drawings (Gerber preferred)', 'select', {options: yesNoOpt}),
    easyFormElement('mad', 'Mechanical assembly drawings', 'select', {options: yesNoOpt}),
    easyFormElement('samples', 'Samples of completed boards / assemblies (if available)', 'select', {options: yesNoOpt}),
    easyFormElement('tests', 'Test specifications and/or times for ICT, Burn In and FCT', 'select', {options: yesNoOpt}),
    easyFormElement('eq_details', 'Details of any equipment to be consigned', 'select', {options: yesNoOpt}),
    easyFormElement('programming', 'Programming requirement/specifications', 'select', {options: yesNoOpt}),
    easyFormElement('sp_details', 'Details of special processes required eg. Conformal coating, underfilling, X-Ray, potting etc.', 'select', {options: yesNoOpt}),
    easyFormElement('packaging_delivery', 'Packaging requirement and delivery terms', 'select', {options: ['Standard']}),
    easyFormElement('RoHS', 'RoHS Compliance (Y/N)', 'select', {options: yesNoOpt}),
    easyFormElement('class', 'ISO and IPC 610 requirement (Class II or III)', 'select', {options: ['Class II', 'Class III']}),

    easyFormElement('comments', 'Comments', 'textarea')
];  

const additionalInformationFields = [
    easyFormElement('customer_disclose', 'Can end customer’s name be disclosed to suppliers?', 'select', {options: yesNoOpt}),
    easyFormElement('customer_sell', 'Customer’s target sell price', 'select', {options: yesNoOpt}),
    easyFormElement('comments', 'Comments', 'textarea')
];

function CreateQuote(props){
    const [formValues, setFormValues] = useState({});
    const [productInformationValues, setProductInformationValues] = useState({});
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
        props.back();
    }
    function handleSubmit(){
        console.log(formValues);
        console.log(productInformationValues);
        props.toCustomerBom();
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
                <h3>{props.title}</h3>
                <Form>
                {quoteFormFields.map((e, i) => 
                    <FlexFormGroup key={i} {...e} onChange={handleFormChange}/>
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
}

function FlexFormGroup(props){
    //const [val, setVal] = useState(null);
    function handleChange(e){
        console.log(e.target.value);
        if(props.onChange) props.onChange(e.target.value, props.formId)
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
        }

    }
    return(
        <Form.Group style={{marginBottom: '7px'}}>
            <Form.Label>{props.label}</Form.Label>
            {form()}
        </Form.Group>
    )
}

function FormSelect(props){
    function handleChange(e){
        console.log(e.target.value);
    }
    return(
        <Form.Group>
            <Form.Label>{props.label}</Form.Label>
        <Form.Select value={''} onChange={handleChange}>
            {props.options.map((opt) => {
                return <option value={opt}>{opt}</option>
            })}
        </Form.Select>
        </Form.Group>
    );
}

export default CreateQuote;