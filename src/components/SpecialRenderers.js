import {useState, useEffect, useMemo} from 'react';

import Button from 'react-bootstrap/Button';
import Accordion from 'react-bootstrap/Accordion';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';

import {useServerUrl} from './../hooks/Urls';

import {SuggestionSearcher} from './Searcher';
import {TemplateModal} from './Modals';

import {LabeledCheckbox} from './Forms';

import './../css/main.css';
import axios from 'axios';
import update from 'immutability-helper';

export function ManufacturerRenderer(props){
    const serverUrl = useServerUrl();
    const [manufacturerModal, setManufacturerModal] = useState(false);
    const [searchResults, setSearchResults] = useState(new Map());
    const [chosenManufacturer, setChosenManufacturer] = useState(null);
    //const [chosenDatabaseManufacturers, setChosenDatabaseManufacturers] = useState([]);
    const [chosenManufacturers, setChosenManufacturers] = useState(props.value.manufacturer_filter);
    const [updater, setUpdater] = useState(0);
    useEffect(() => {
        setChosenManufacturer(props.value.linked_manufacturer);
    }, [props.value.linked_manufacturer]);
    const suggestionSize = 5;
    const bd = (
        <div>
        <SuggestionSearcher searchTerm={chosenManufacturer ? chosenManufacturer.name : null} 
        recommends={[...searchResults.keys()]} onSearch={handleSearch} 
        onClickSuggestion={handleClickSuggestion} size={suggestionSize} updater={updater}/>
        {/*chosenSuggestion && 
            <div>
                <ManufacturerStringInterface show={manufacturerStringModal} manuName={chosenSuggestion.name} 
                databaseManufacturers={chosenDatabaseManufacturers}/>
            </div>
        */}
        {/*
        <Accordion alwaysopen={true} defaultActiveKey={["0"]}>
            <Accordion.Item eventKey="0">
            <Accordion.Header>Display Manufacturers</Accordion.Header>
                <Accordion.Body>
                    <ManufacturerList manufacturers={props.value.found_manufacturers} 
                    chosenManufacturers={chosenManufacturers} 
                    onChangeManufacturers={handleChangeManufacturer}/>
                </Accordion.Body>
            </Accordion.Item>      
        */}
            {/*chosenSuggestion &&
            <ManufacturerStringInterface show={manufacturerStringModal} manuName={chosenSuggestion.name} 
            databaseManufacturers={chosenDatabaseManufacturers} onSaveManufacturers={handleSaveManufacturers}/>
            */}
        {/*</Accordion>*/}
        <h3>Filter Manufacturers</h3>
        <ManufacturerList manufacturers={props.value.found_manufacturers} 
            chosenManufacturers={chosenManufacturers} 
            onChangeManufacturers={handleChangeManufacturer}/>
        </div>
    );
    const isSaveDisabled = chosenManufacturer === null;
    const footer = (
        <>
        {/*<Button onClick={handleSaveManufacturers} disabled={isSaveDisabled}>Save Manufacturer</Button>*/}
        <Button onClick={handleCloseModal} variant="secondary">Close</Button>
        <Button onClick={handleSubmit} variant="primary">Submit</Button>
        </>
    );
    useEffect(() => {
        setChosenManufacturers(props.value.manufacturer_filter);
    }, [props.value.manufacturer_filter]);
    function handleChangeManufacturer(checked){
        setChosenManufacturers(checked);
    }
    function handleSubmit(){
        handleCloseModal();
        if(chosenManufacturers !== null){
            //run function 
            //parameters: row, manufacturer set
            //console.log(props.functions);
            if(chosenManufacturer !== null){
                chosenManufacturer.strings = [...chosenManufacturers].map((s) => s.toLowerCase());
                const chosen = new Set([...chosenManufacturers]);
                chosen.add(chosenManufacturer.name);
                const remove = props.value.found_manufacturers.reduce((arr, m) => {
                    if(!chosenManufacturers.has(m)) arr.push(m);
                    return arr;
                }, []);
                axios({
                    method: 'POST',
                    url: serverUrl+'api/manufacturer',
                    data: {
                        strings: [...chosen], remove: remove, id: chosenManufacturer.id
                    }
                }).then((response) => {
                    console.log(response.data);
                });
            }
            props.functions.filterManufacturers(props.rowNum, chosenManufacturer);
        }
    }
    function handleSearch(st){
        if(st !== ''){
            axios({
                method: 'GET',
                url: serverUrl+'api/manufacturer',
                params: {search: st, limit: suggestionSize}
            }).then((response) => {
                const data = response.data;
                const mp = new Map();
                data.search.forEach((manu) => {
                    mp.set(manu.name, manu.id);
                })
                setSearchResults(mp);
            });
        }
    }
    function handleSaveManufacturers(strings=null){
        const chosen = strings === null ? strings : (chosenManufacturers === null ? props.value.found_manufacturers : 
        [...chosenManufacturers]);
        axios({
            method: 'POST',
            url: serverUrl+'api/manufacturer',
            data: {
                strings: chosen, id: chosenManufacturer.id
            }
        }).then((response) => {
            console.log(response);
        });
    }
    function handleClickSuggestion(suggestion){
        const cs = {
            name: suggestion,
            id: searchResults.get(suggestion)
        }
        setSearchResults(new Map());
        //setChosenSuggestion(cs);
        setUpdater(updater+1);
        axios({
            method: 'GET',
            url: serverUrl+'api/manufacturer',
            params: {find_strings_id: cs.id}
        }).then((response) => {
            console.log(response);
            //set
            const stringSet = new Set(response.data.strings);
            const found = props.value.found_manufacturers.reduce((s, m) => {
                if(stringSet.has(m.toLowerCase())){
                    s.add(m);
                }
                return s;
            }, new Set());
            setChosenManufacturers(found);
            //setChosenDatabaseManufacturers(response.data.strings);
            cs.strings = [...response.data.strings];
            setChosenManufacturer(cs);
            props.functions.addManufacturerData(cs);
        });
    }
    function handleOpenModal(){
        setManufacturerModal(true);
        //setChosenManufacturers(null);
    }
    function handleCloseModal(){
        setManufacturerModal(false);
    }
    const buttonString = props.value.linked_manufacturer !== null ? props.value.linked_manufacturer.name : 
    (props.value.bom ? props.value.bom : 'Manufacturers');
    return(
        <>
        <Button onClick={handleOpenModal} variant={props.value.linked_manufacturer === null ? 'danger' : 'primary'}>
        {buttonString}
        </Button>
        <TemplateModal show={manufacturerModal} title='Manufacturer' body={bd} footer={footer} onClose={handleCloseModal}/>
        </>
    );
}

function ManufacturerList(props){
    //change to listgroup highlights indicate active
    const [manufacturersCheckboxes, setManufacturersCheckboxes] = useState(props.manufacturers.reduce((obj, manu) => {
        if(props.chosenManufacturers === null || props.chosenManufacturers.has(manu)){
            obj[manu] = true;
        }else{
            obj[manu]= false;
        }
        return obj;
    }, {}));
    useEffect(() => {
        setManufacturersCheckboxes(props.manufacturers.reduce((obj, manu) => {
            if(props.chosenManufacturers === null || props.chosenManufacturers.has(manu)){
                obj[manu] = true;
            }else{
                obj[manu]= false;
            }
            return obj;
        }, {}));
    }, [props.manufacturers, props.chosenManufacturers]);
    function handleChangeManufacturer(manu){
        return function(){
            /*
            const newCheckboxes = {...manufacturersCheckboxes};
            newCheckboxes[manu] = !newCheckboxes[manu];
            setManufacturersCheckboxes(newCheckboxes);
            const checkedSet = new Set(Object.entries(newCheckboxes).reduce((arr, [key, val]) => {
                if(val) arr.push(key);
                return arr;
            }, []));*/
            const checkedSet = new Set(props.chosenManufacturers);
            if(checkedSet.has(manu)){
                checkedSet.delete(manu);
            }else{
                checkedSet.add(manu);
            }
            props.onChangeManufacturers(checkedSet);
        }
    }
    return(
        <>
        {/*
            props.manufacturers.map((manu, i) => 
            <LabeledCheckbox key={i} label={manu} id={manu} className='Pointer'
            checked={manufacturersCheckboxes[manu]} disabled={false}
            onChange={handleChangeManufacturer(manu)}/>
            )
        */}
        <ListGroup>
            {props.manufacturers.map((manu, i) =>
            <ListGroup.Item key={i} onClick={handleChangeManufacturer(manu)} className={'ManufacturerItem'} 
            active={manufacturersCheckboxes[manu]}>
                {manu}
            </ListGroup.Item>
            )}
        </ListGroup>
        </>
    );
}

function ManufacturerStringInterface(props){
    const serverUrl = useServerUrl();
    const [strings, setStrings] = useState(props.databaseManufacturers);
    const [addString, setAddString] = useState(null);
    //const [addIndex, setAddIndex] = useStat
    const [selectedString, setSelectedString] = useState(null);
    useEffect(() => {
        setStrings(props.databaseManufacturers);
    }, [props.databaseManufacturers]);
    function handleClickString(string, i){
        return function(){
            setSelectedString({string: string, index: i});
        }
    }
    function handleKeyDown(e){
        if(e.key == 'Enter'){
            enterString();
        }
    }
    function handleChangeTerm(e){
        setAddString(update(addString, {
            string: {$set: e.target.value}
        }));
    }
    function handleAdd(){
        setAddString({string: '', index: strings.length});
        setStrings(strings.concat(''));
    }
    function handleEdit(){
        setAddString({string: selectedString.string, index: selectedString.index})
    }
    function handleSave(){
        props.onSaveManufacturers(strings);
    }
    function handleDelete(){
        //const index = strings.findIndex((i) => i === selectedString);
        const newStrings = [...strings];
        newStrings.splice(selectedString.index, 1);
        setStrings(newStrings);
    }
    function enterString(){
        const toAdd = addString.string;
        const f = strings.findIndex((s) => s === toAdd);
        //console.log(f);
        if(f === -1){
            setStrings(update(strings, {
                [addString.index]: {$set: addString.string}
            }));
            setAddString(null);
            setSelectedString(null);
        }
    }
    return(
        <>
            <Accordion.Item eventKey="1">
                <Accordion.Header>{props.manuName} Strings</Accordion.Header>
                <Accordion.Body>
                <ListGroup>
                    {strings.map((manuString, i) => {
                        //const cl = selectedString === manuString ? 'SelectedManufacturer' : 'ManufacturerItem';
                        const cl = 'ManufacturerItem';
                        const content = addString !== null && addString.index === i ? <Form.Control
                        type="text"
                        placeholder="Type manufacturer string"
                        onChange={handleChangeTerm}
                        onKeyDown={handleKeyDown} onBlur={enterString}
                        value={addString.string}
                        /> : manuString;
                        const isActive = selectedString !== null && selectedString.index === i;
                        return(
                        <ListGroup.Item key={i} className={cl} active={isActive} onClick={handleClickString(manuString, i)}>
                            {content}
                        </ListGroup.Item>
                        );
                    })}
                    {/*addString !== null && 
                    <ListGroup.Item>
                        <Form.Control type="text"
                        placeholder="Type manufacturer string"
                        onChange={handleChangeTerm}
                        onKeyDown={handleKeyDown} onBlur={enterString}
                        />
                    </ListGroup.Item>
                    */}
                </ListGroup>
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={handleAdd}>Add</Button>
                <Button onClick={handleEdit} disable={selectedString === null}>Edit</Button>
                <Button onClick={handleDelete} disable={selectedString === null}>Delete</Button>
                </Accordion.Body>
            </Accordion.Item>
        </>
    );
}

