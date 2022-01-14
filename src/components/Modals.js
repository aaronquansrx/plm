import React, {useEffect, useState} from 'react';
import update from 'immutability-helper';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export function ExportModal(props){
    const [fn, setFn] = useState('');
    const handleClose = () => props.hideAction();
    const handleExport = () => {
        props.exportAction(fn);
        props.hideAction();
    };
    function handleChange(e){
        setFn(e.target.value);
    }
    return(
    <Modal show={props.show} onHide={handleClose}>
    <Modal.Header closeButton>
        <Modal.Title>Export Excel</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        File Name: <input type='text' value={fn} onChange={handleChange}/>
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