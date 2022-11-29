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
    const [chosenSuggestion, setChosenSuggestion] = useState(null);
    const [chosenDatabaseManufacturers, setChosenDatabaseManufacturers] = useState([]);
    const [chosenManufacturers, setChosenManufacturers] = useState(props.value.manufacturer_filter);
    const [updater, setUpdater] = useState(0);

    const [manufacturerStringModal, setManufacturerStringModal] = useState(false);
    const suggestionSize = 5;
    const bd = (
        <div>
        <SuggestionSearcher searchTerm={chosenSuggestion ? chosenSuggestion.name : null} 
        recommends={[...searchResults.keys()]} onSearch={handleSearch} 
        onClickSuggestion={handleClickSuggestion} size={suggestionSize} updater={updater}/>
        {/*chosenSuggestion && 
        <div>
            <div>Name: {chosenSuggestion.name}</div>
            <div>ID: {chosenSuggestion.id}</div>
            <ManufacturerStringInterface show={manufacturerStringModal} manuName={chosenSuggestion.name} 
            databaseManufacturers={chosenDatabaseManufacturers}/>
        </div>
    */}
        <Accordion alwaysOpen defaultActiveKey={["0"]}>
            <Accordion.Item eventKey="0">
            <Accordion.Header>Display Manufacturers</Accordion.Header>
                <Accordion.Body>
                    <ManufacturerList manufacturers={props.value.found_manufacturers} 
                    chosenManufacturers={chosenManufacturers} 
                    onChangeManufacturers={handleChangeManufacturer}/>
                </Accordion.Body>
            </Accordion.Item>
            {chosenSuggestion &&
            <ManufacturerStringInterface show={manufacturerStringModal} manuName={chosenSuggestion.name} 
            databaseManufacturers={chosenDatabaseManufacturers} onSaveManufacturers={handleSaveManufacturers}/>
            }
        </Accordion>
        </div>
    );
    const isSaveDisabled = chosenSuggestion === null;
    const footer = (
        <>
        <Button onClick={handleSaveManufacturers} disabled={isSaveDisabled}>Save Manufacturer</Button>
        <Button onClick={handleSubmit}>Submit</Button>
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
            console.log(props.functions);
            props.functions.filterManufacturers(props.rowNum, chosenManufacturers);
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
                strings: chosen, id: chosenSuggestion.id
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
        setChosenSuggestion(cs);
        setUpdater(updater+1);
        axios({
            method: 'GET',
            url: serverUrl+'api/manufacturer',
            params: {find_strings_id: cs.id}
        }).then((response) => {
            console.log(response);
            //set
            const stringSet = new Set(response.data.strings);
            setChosenManufacturers(stringSet);
            setChosenDatabaseManufacturers(response.data.strings);
        });
    }
    function handleOpenModal(){
        setManufacturerModal(true);
        //setChosenManufacturers(null);
    }
    function handleCloseModal(){
        setManufacturerModal(false);
    }
    return(
        <>
        <Button onClick={handleOpenModal}>{props.value.bom !== null ? props.value.bom : 'Manufacturers'}</Button>
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
    function handleClickString(string){
        return function(){
            setSelectedString(string);
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
        setAddString({string: '', index: strings});
        setStrings(strings.concat(''));
    }
    function handleEdit(){

    }
    function handleSave(){
        props.onSaveManufacturers(strings);
    }
    function handleDelete(){
        const index = strings.findIndex((i) => i === selectedString);
        const newStrings = [...strings].splice(index, 1);
        setStrings(newStrings);
    }
    function enterString(){
        const toAdd = addString;
        const f = strings.findIndex((s) => s === toAdd);
        //console.log(f);
        if(f === -1){
            setStrings(strings['string'].concat(toAdd));
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
                        const content = addString.index === i ? <Form.Control
                        type="text"
                        placeholder="Type manufacturer string"
                        onChange={handleChangeTerm}
                        onKeyDown={handleKeyDown} onBlur={enterString}
                        value={addString.string}
                        /> : {manuString};
                        return(
                        <ListGroup.Item key={i} className={cl} active={selectedString === manuString} onClick={handleClickString(manuString)}>
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
                <Button onClick={handleEdit} disable={selectedString !== null}>Edit</Button>
                <Button onClick={handleDelete} disable={selectedString !== null}>Delete</Button>
                </Accordion.Body>
            </Accordion.Item>
        </>
    );
}

