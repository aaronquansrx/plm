import React, {useEffect, useState} from 'react';
import update from 'immutability-helper';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { Accordion } from 'react-bootstrap';

import { NamedCheckBox } from './Checkbox';

export function ExportModal(props){
    const [fn, setFn] = useState('');
    const [options, setOptions] = useState({bestPrice: false});
    const handleClose = () => props.hideAction();
    const handleExport = () => {
        props.exportAction(fn, options);
        props.hideAction();
    };
    function handleChange(e){
        setFn(e.target.value);
    }
    function handleBPOptionChange(e){
        setOptions(update(options, {
            bestPrice: {$set: !options.bestPrice}
        }));
    }
    return(
    <Modal show={props.show} onHide={handleClose}>
    <Modal.Header closeButton>
        <Modal.Title>Export Excel</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        File Name: <input type='text' value={fn} onChange={handleChange}/>
        <NamedCheckBox value='bestPrice' label='Best Price' 
        onChange={handleBPOptionChange} checked={options.bestPrice}/>
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
            {/*props.data.map((line, ln) => 
                //display lines of bom which open up
                //list of check boxes for each api
                <div>
                    {line.mpn}
                    {apis.map((cb,i) => 
                    <div key={i}>
                        {cb.Header}
                        <input className="form-check-input" type="checkbox" value={cb.accessor} 
                        checked={checkedBoxes[ln][cb.accessor]} onChange={handleChange(ln,cb.name)}/>   
                    </div>
                    )}
                </div>
            )*/}
        </Modal.Body>

        <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        <Button variant="primary" onClick={handleSubmit}>Submit</Button>
        </Modal.Footer>
        </Modal>
    )
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
                <div>
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