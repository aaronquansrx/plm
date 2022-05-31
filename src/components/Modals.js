import React, {useEffect, useState} from 'react';
import update from 'immutability-helper';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { Accordion } from 'react-bootstrap';

import { NamedCheckBox } from './Checkbox';
import { TabPages } from './Tabs';

export function ModalController(props){
    const [show, setShow] = useState(false);
    function handleClose(){
        setShow(false);
    }
    function handleOpen(){
        setShow(true);
    }
    useEffect(() => {
        setShow(false);
    }, [props.hide]);
    const tempModal = (
        <TemplateModal show={show} body={props.body} title={props.title} 
        footer={props.footer} onClose={handleClose}/>
    )
    return (
        <div>
            <div onClick={handleOpen}>
                {props.activateModal}
            </div>
            {show && tempModal}
        </div>
    )
}

export function TemplateModal(props){
    const closeButton = props.closeButton ? props.closeButton : true;
    function handleClose(){
        if(props.onClose) props.onClose();
    }
    return(
        <Modal show={props.show} onHide={handleClose}>
        <Modal.Header closeButton={closeButton}>
            {props.title && <Modal.Title>{props.title}</Modal.Title>}
        </Modal.Header>

        {props.body && <Modal.Body>
            {props.body}
        </Modal.Body>}

        {props.footer && <Modal.Footer>
            {props.footer}
        </Modal.Footer>}
        </Modal>
    )
}

export function ExportModal(props){
    const [fn, setFn] = useState('');
    const [options, setOptions] = useState({lowestPrice: false, lowestLead: false});
    const handleClose = () => props.hideAction();
    const handleExport = () => {
        props.exportAction(fn, options);
        props.hideAction();
    };
    function handleChange(e){
        setFn(e.target.value);
    }
    function handleOptionChange(option){
        return function(){
            const optVal = !options[option];
            const newOptions = Object.keys(options).reduce((obj, key) => {
                obj[key] = false;
                return obj;
            }, {});
            //console.log(newOptions);
            newOptions[option] = optVal;
            /*
            setOptions(update(options, {
                [option]: {$set: !options[option]}
            }));*/
            setOptions(newOptions);
        }
    }
    return(
    <Modal show={props.show} onHide={handleClose}>
    <Modal.Header closeButton>
        <Modal.Title>Export Excel</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        File Name: <input type='text' value={fn} onChange={handleChange}/>
        <NamedCheckBox value='lowestPrice' label='Lowest Price' 
        onChange={handleOptionChange('lowestPrice')} checked={options.lowestPrice}/>
        <NamedCheckBox value='lowestLead' label='Lowest Lead' 
        onChange={handleOptionChange('lowestLead')} checked={options.lowestLead}/>
    </Modal.Body>

    <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        <Button variant="primary" onClick={handleExport}>Export</Button>
    </Modal.Footer>
    </Modal>
    )
}

export function FeedbackModal(props){
    return (
        <Modal>
            
        </Modal>
    )
}

export function UpdateInformationModal(props){
    const handleClose = () => props.hideAction();
    return(
        <Modal show={props.show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Export Excel</Modal.Title>
        </Modal.Header>

        <Modal.Body>
            Woo
        </Modal.Body>

        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
        </Modal.Footer>
        </Modal>
    )
}

export function CheckBoxModal(props){
    const [checkBoxes, setCheckBoxes] = useState(props.boxes.map(b => { return {name: b.name, checked: b.checked};}));
    useEffect(() => {
        setCheckBoxes(props.boxes.map(b => { return {name: b.name, checked: b.checked};}));
    }, []);
    const handleClose = () => props.hideAction();
    const handleSubmit = () => {
        props.submitAction(checkBoxes);
        props.hideAction();
    };
    function handleChange(i){
        return function(){
            setCheckBoxes(update(checkBoxes, {
                [i]: {checked: {$set: !checkBoxes[i].checked}}
            }));
        }
    }
    return(
        <Modal show={props.show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Activated APIs</Modal.Title>
        </Modal.Header>

        <Modal.Body>
            {checkBoxes.map((cb,i) => 
            <div key={i}>
                {cb.name}
                <input className="form-check-input" type="checkbox" 
                value={cb.name} checked={cb.checked} onChange={handleChange(i)}/>   
            </div> 
            )}
        </Modal.Body>

        <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        <Button variant="primary" onClick={handleSubmit}>Submit</Button>
        </Modal.Footer>
        </Modal>
    )
}

export function BomApiCheckBoxModal(props){
    const apis = props.apis;
    const checkedBoxes = props.bomApiCheckBoxes;
    const handleClose = () => props.hideAction();
    const handleSubmit = () => {
        props.submitAction();
        props.hideAction();
    };
    return(
        <Modal show={props.show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Activated APIs</Modal.Title>
        </Modal.Header>

        <Modal.Body>
            <BomApiCheckBoxAccordion data={props.data} apis={apis} 
            checkedBoxes={checkedBoxes} onCheckChange={props.onCheckChange}/>
            {/*<GlobalApiCheckBoxes apis={apis}/>*/}
        </Modal.Body>

        <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        <Button variant="primary" onClick={handleSubmit}>Submit</Button>
        </Modal.Footer>
        </Modal>
    )
}

function GlobalApiCheckBoxes(props){
    const apis = props.apis;
    console.log(apis);
    const [checked, setChecked] = useState(apis.reduce((obj, api) => {
        obj[api.accessor] = true;
        return obj;
    }), {});
    function handleChange(api){
        return function(){
            setChecked(update(checked, {
                [api]: {$set: !checked[api]}
            }));
        }
    }
    return(
        <>
        {apis.map((cb,i) => 
            <div key={i}>
                <NamedCheckBox value={cb.accessor} onChange={handleChange(cb.accessor)} label={cb.Header}
                checked={checked[cb.accessor]}/>
            </div>
        )}
        </>
    );
}

function BomApiCheckBoxAccordion(props){
    const data = props.data;
    const apis = props.apis;
    const checkedBoxes = props.checkedBoxes;
    function handleChange(ln, api_name){
        return function(){
            props.onCheckChange(ln, api_name);
        }
    }
    /*<input className="form-check-input" type="checkbox" value={cb.accessor} 
    checked={checkedBoxes[ln][cb.accessor]} onChange={handleChange(ln,cb.accessor)}/>
    */
    return(
        <Accordion>
            {data.map((line, ln) => 
                <Accordion.Item key={ln} eventKey={ln}>
                    <Accordion.Header>{line.mpn}</Accordion.Header>
                    <Accordion.Body>
                    {apis.map((cb,i) => 
                    <div key={i}>
                        <NamedCheckBox value={cb.accessor+ln} onChange={handleChange(ln,cb.accessor)} label={cb.Header}
                        checked={checkedBoxes[ln][cb.accessor]}/>
                    </div>
                    )}
                    </Accordion.Body>
                </Accordion.Item>
            )}
        </Accordion>
    );
}

export function AutoColumnOptionModal(props){
    const handleClose = () => props.hideAction();
    function handleChange(i){
        return function(){
            props.onCheckChange(i);
        }
    }
    function disabledProps(accessor){
        return accessor !== 'quantity';
    }
    return(
    <Modal show={props.show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Auto Column Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {props.attributes.map((header, i) => 
                <div key={i}>
                <NamedCheckBox value={header.accessor} checked={header.active}
                label={header.Header} onChange={handleChange(i)} disabled={disabledProps(header.accessor)}/>
                </div>
            )}
        </Modal.Body>
        <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        </Modal.Footer>
    </Modal>
    );
}

export function VersionModal(props){
    const handleClose = () => props.hideAction();
    const versions = [
        {
            name: '1.0',
            content: <div>Version 1.0</div>
        },
        {
            name: '0.0',
            content: 'o'
        }
    ]
    return(
        <Modal show={props.show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Version Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                In development
                <TabPages tabs={versions}/>
            </Modal.Body>
        </Modal>
    );
}