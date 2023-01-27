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
    const fullLowerManuSet = new Set(props.value.found_manufacturers.map((m) => m.toLowerCase()));
    const [lowerManuStrings, setLowerManuStrings] = useState(props.value.database_strings);
    const [originalManuStrings, setOriginalManuStrings] = useState(props.value.database_strings);

    const [updater, setUpdater] = useState(0);
    useEffect(() => {
        const s = new Set([...props.value.database_strings]);
        if(props.value.bom) s.add(props.value.bom.toLowerCase());
        setLowerManuStrings([...s]);
        setOriginalManuStrings(props.value.database_strings);
    }, [props.value.database_strings]);
    useEffect(() => {
        setChosenManufacturer(props.value.linked_manufacturer);
    }, [props.value.linked_manufacturer]);
    const suggestionSize = 5;
    const bd = (
        <div>
        {!chosenManufacturer ? <SuggestionSearcher
        recommends={[...searchResults.keys()]} onSearch={handleSearch} 
        onClickSuggestion={handleClickSuggestion} size={suggestionSize} updater={updater}/>
        : <Button className={'ChosenManufacturerButton'} onClick={handleDeselectManufacturer}>{chosenManufacturer.name}</Button>
    }
        <h3>Filter Manufacturers</h3>
        <ManufacturerList manufacturers={props.value.found_manufacturers} 
            chosenManufacturers={chosenManufacturers} 
            onChangeManufacturers={handleChangeManufacturer}/>
        {chosenManufacturer &&
            <ManufacturerStringInterface show={manufacturerModal} manuName={chosenManufacturer.name} bomManu={props.value.bom}
            databaseManufacturers={lowerManuStrings} originalManuStrings={originalManuStrings} 
            onUpdateStrings={handleUpdateStrings}
            //onSaveManufacturers={handleSaveManufacturers}
            />
        }
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
    function handleChangeManufacturer(checked, change){
        if(chosenManufacturer){
            //console.log(change.manufacturer);
            if(!(change.manufacturer.toLowerCase() === props.value.bom.toLowerCase() || change.manufacturer.toLowerCase() === chosenManufacturer.name.toLowerCase())){
                const newChecked = change.adding ? new Set([...props.value.found_manufacturers].reduce((arr, m) => {
                    if(m.toLowerCase() === change.manufacturer.toLowerCase()){
                        arr.push(m);
                    }
                    return arr;
                }, []).concat([...checked])) : new Set([...checked].reduce((arr, m) => {
                    if(m.toLowerCase() !== change.manufacturer.toLowerCase()){
                        arr.push(m);
                    }
                    return arr;
                }, []));
                setChosenManufacturers(newChecked);

                const lowerChecked = new Set([...newChecked].map((m) => m.toLowerCase()));
                const s = new Set([...lowerManuStrings]);
                fullLowerManuSet.forEach((m) => {
                    if(lowerChecked.has(m)){
                        s.add(m);
                    }else{
                        s.delete(m);
                    }
                });
                setLowerManuStrings([...s]);
            }
        }else{
            setChosenManufacturers(checked);
        }
    }
    function handleUpdateStrings(strs){
        setLowerManuStrings(strs);
        const newChosen = new Set([...chosenManufacturers]);
        const strSet = new Set(strs);
        props.value.found_manufacturers.forEach(m => {
            if(strSet.has(m.toLowerCase())){
                newChosen.add(m);
            }else{
                newChosen.delete(m);
            }
        });
        setChosenManufacturers(newChosen);

    }
    function handleSubmit(){
        handleCloseModal();
        if(chosenManufacturers !== null){
            //run function 
            //parameters: row, manufacturer set
            //console.log(props.functions);
            if(chosenManufacturer !== null){
                chosenManufacturer.strings = [...lowerManuStrings].map((s) => s.toLowerCase());
                const chosen = new Set([...chosenManufacturers]);
                chosen.add(chosenManufacturer.name);
                chosen.add(props.value.bom);
                const remove = props.value.found_manufacturers.reduce((arr, m) => {
                    if(!chosenManufacturers.has(m)) arr.push(m);
                    return arr;
                }, []);
                /*
                axios({
                    method: 'POST',
                    url: serverUrl+'api/manufacturer',
                    data: {
                        strings: [...chosen], remove: remove, id: chosenManufacturer.id
                    }
                }).then((response) => {
                    console.log(response.data);
                });
                */
                const toAdd = new Set([...lowerManuStrings]);
                //toAdd.add(chosenManufacturer.name.toLowerCase());
                //toAdd.add(props.value.bom.toLowerCase());
                console.log(toAdd);
                axios({
                    method: 'POST',
                    url: serverUrl+'api/manufacturer',
                    data: {
                        strs: [...toAdd], id: chosenManufacturer.id
                    }
                }).then((response) => {
                    console.log(response.data);
                });
            }
            props.functions.filterManufacturers(props.rowNum, chosenManufacturer);
            console.log(chosenManufacturer);
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
    function handleDeselectManufacturer(){
        //props.functions.filterManufacturers(props.rowNum, null);
        setChosenManufacturer(null);
        //console.log(chosenManufacturers);
        console.log(props.value.found_manufacturers);
        setChosenManufacturers(new Set(props.value.found_manufacturers))
    }
    function handleSaveManufacturers(strings=null){
        const chosen = strings === null ? strings : (chosenManufacturers === null ? props.value.found_manufacturers : 
        [...chosenManufacturers]);
        console.log(strings);
        axios({
            method: 'POST',
            url: serverUrl+'api/manufacturer',
            data: {
                strings: chosen, id: chosenManufacturer.id
            }
        }).then((response) => {
            console.log(response.data);
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
            stringSet.add(props.value.bom.toLowerCase());
            stringSet.add(cs.name.toLowerCase());
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

            stringSet.add(props.value.bom.toLowerCase());
            stringSet.add(cs.name.toLowerCase());
            setLowerManuStrings([...stringSet]);
            setOriginalManuStrings(response.data.strings);
        });
    }
    function handleOpenModal(){
        setManufacturerModal(true);
        //setChosenManufacturers(null);
    }
    function handleCloseModal(){
        setManufacturerModal(false);
    }
    //console.log(props.value);
    const buttonString = /*props.value.linked_manufacturer !== null ? props.value.linked_manufacturer.name : */
    (props.value.bom ? props.value.bom : 'Manufacturers');
    return(
        <>
        <Button onClick={handleOpenModal} variant={props.value.linked_manufacturer === null ? 'danger' : 'primary'}>
        {buttonString}
        {props.value.linked_manufacturer && props.value.bom !== props.value.linked_manufacturer.name 
        && ' ('+props.value.linked_manufacturer.name+')'}
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
            const change = {adding: true, manufacturer: manu};
            if(checkedSet.has(manu)){
                change.adding = false;
                checkedSet.delete(manu);
            }else{
                checkedSet.add(manu);
            }
            props.onChangeManufacturers(checkedSet, change);
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
    const manus = [...props.databaseManufacturers];
    const original = new Set(props.originalManuStrings);
    const [strings, setStrings] = useState(manus);
    const [addString, setAddString] = useState(null);
    const [selectedString, setSelectedString] = useState(null);
    useEffect(() => {
        setStrings(manus);
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
        setSelectedString(null);
        props.onUpdateStrings(newStrings);
    }
    function enterString(){
        const toAdd = addString.string;
        const f = strings.findIndex((s) => s === toAdd);
        //console.log(f);
        if(f === -1){
            const strs = update(strings, {
                [addString.index]: {$set: addString.string}
            })
            setStrings(update(strings, {
                [addString.index]: {$set: addString.string}
            }));
            setAddString(null);
            setSelectedString(null);
            props.onUpdateStrings(strs);
        }
        
    }
    const dis = selectedString === null || (selectedString !== null && 
        (selectedString.string === props.manuName.toLowerCase() || selectedString.string === props.bomManu.toLowerCase()));
    return(
        <Accordion>
            <Accordion.Item eventKey="0">
                <Accordion.Header>{props.manuName} Strings</Accordion.Header>
                <Accordion.Body>
                <ListGroup>
                    {strings.map((manuString, i) => {
                        //const cl = selectedString === manuString ? 'SelectedManufacturer' : 'ManufacturerItem';
                        const cl = original.has(manuString) ? 'ManufacturerItem' : 'NewManufacturerItem';
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
                {/*<Button onClick={handleSave}>Save</Button>*/}
                <Button onClick={handleAdd}>Add</Button>
                <Button onClick={handleEdit} disabled={dis}>Edit</Button>
                <Button onClick={handleDelete} disabled={dis}>Delete</Button>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}

