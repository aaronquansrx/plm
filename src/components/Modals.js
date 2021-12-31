import React, {useState} from 'react';

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