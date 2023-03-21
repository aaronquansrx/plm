import React, {useEffect, useState} from 'react';
import update from 'immutability-helper';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { Accordion } from 'react-bootstrap';

import { NamedCheckBox } from './Checkbox';
import { TabPages } from './Tabs';
import { NameForm, LoginForm, LabeledCheckbox} from './Forms';

import './../css/main.css';

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
        <TemplateModal modalClass={props.modalClass} show={show} body={props.body} title={props.title} 
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
        <Modal dialogClassName={props.modalClass} show={props.show} onHide={handleClose}>
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
    const exportOptions = [
        {value: 'bestoffer', label: 'Best Offer Only'},
        {value: 'evaluation', label: 'Evaluation Sheet'},
        {value: 'filteredApiAttrs', label: 'Use Filtered API Attributes'},
        {value: 'selected', label: 'Add selected offers'}
    ];
    const [options, setOptions] = useState(exportOptions.reduce((obj, opt) => {
        obj[opt.value] = false;
        return obj; 
    }, {}));
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
    function changeOption(e){
        const opt = e.target.value;
        const opp = !options[opt];
        setOptions(update(options, {
            [opt]: {$set: opp}
        }));
    }
    return(
    <Modal show={props.show} onHide={handleClose}>
    <Modal.Header closeButton>
        <Modal.Title>Export Excel</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        File Name: <input type='text' value={fn} onChange={handleChange}/>
        {/*
        <NamedCheckBox value='bestprice' label='Best Price' 
        onChange={handleOptionChange('bestprice')} checked={options.bestprice}/>
        <NamedCheckBox value='bestleadtime' label='Best Leadtime' 
        onChange={handleOptionChange('bestleadtime')} checked={options.bestleadtime}/>
        */}
        {exportOptions.map((opt, i) => {
            return <NamedCheckBox key={i} value={opt.value} label={opt.label} 
            onChange={changeOption} checked={options[opt.value]}/>
        })}
        {/*
        <NamedCheckBox value='bestoffer' label='Best Offer Only'
        onChange={changeOption} checked={options.bestoffer}/>
        <NamedCheckBox value='evaluation' label='Evaluation Sheet' 
        onChange={changeOption} checked={options.evaluation}/>
        <NamedCheckBox value='filteredApiAttrs' label='Use Filtered API Attributes' 
        onChange={changeOption} checked={options.filteredApiAttrs}/>
        */}
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
        return accessor === 'mpn';
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
/*
<p>
                    Saving and loading BOM's in the BOM Tool (requires login)
                </p>

*/
export function VersionModal(props){
    const handleClose = () => props.hideAction();
    return(
        <Modal show={props.show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Version Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TabPages tabs={props.versions}/>
            </Modal.Body>
        </Modal>
    );
}

export function NamingModal(props){
    const [name, setName] = useState('');
    const handleClose = () => props.hideAction();
    function handleSubmit(){
        props.submitAction(name);
        props.hideAction();
    }
    function changeName(sn){
        setName(sn);
    }
    return(
        <Modal show={props.show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <NameForm label={props.nameLabel} changeName={changeName} onClose={handleClose}/>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button variant="primary" onClick={handleSubmit}>{props.submitButton}</Button>
            </Modal.Footer>
        </Modal>
    );
}

export function SaveBom(props){
    const [saveName, setSaveName] = useState('');
    const [saveApiData, setSaveApiData] = useState(true);
    const [overWriteSave, setOverwriteSave] = useState(false);
    const handleClose = () => props.hideAction();
    function handleSave(){
        props.save(saveName, saveApiData, overWriteSave);
        props.hideAction();
    }
    function handleChangeSaveApiData(){
        //console.log(!saveApiData);
        setSaveApiData(!saveApiData);
    }
    function handleChangeOverwriteSave(){
        setOverwriteSave(!overWriteSave);
    }
    function changeName(sn){
        setSaveName(sn);
    }
    return(
        <Modal show={props.show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Save BOM</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <NameForm label={'File Name:'} changeName={changeName} onClose={handleClose}/>
            <LabeledCheckbox label={'Save API Data'} checked={saveApiData} onChange={handleChangeSaveApiData}/>
            {props.showOverwrite && <LabeledCheckbox label={'Overwrite Save'} checked={overWriteSave} onChange={handleChangeOverwriteSave}/>}
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
            </Modal.Footer>
        </Modal>
    );
}

export function Login(props){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const handleClose = () => {
        props.hideAction();
        //document.removeEventListener('keydown', handleKey);
    }
    useEffect(() => {
        function handleKey(e){
            if(e.key === 'Enter'){
                handleLogin();
            }
        }
        if(props.show){
            setUsername('');
            setPassword('');
            document.addEventListener('keydown', handleKey);
        }else{
            //document.removeEventListener('keydown', handleKey);
        }
        return () => {
            document.removeEventListener('keydown', handleKey);
        };
    }, [props.show]);
    function changeUN(un){
        setUsername(un);
    }
    function changePW(pw){
        setPassword(pw);
    }
    function handleLogin(){
        if(username !== ''){
            props.login(username, password);
            props.hideAction();
        }
    }
    return(
        <Modal show={props.show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Login</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <LoginForm changeUsername={changeUN} changePassword={changePW}/>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button variant="primary" onClick={handleLogin}>Login</Button>
            </Modal.Footer>
        </Modal>
    )
}