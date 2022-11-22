import {useState, useEffect, useMemo} from 'react';

import Button from 'react-bootstrap/Button';

import {useServerUrl} from './../hooks/Urls';

import {SuggestionSearcher} from './Searcher';
import {TemplateModal} from './Modals';

import {LabeledCheckbox} from './Forms';

import './../css/main.css';
import axios from 'axios';

export function ManufacturerRenderer(props){
    const serverUrl = useServerUrl();
    const [manufacturerModal, setManufacturerModal] = useState(false);
    const [searchResults, setSearchResults] = useState(new Map());
    const [chosenSuggestion, setChosenSuggestion] = useState(null);
    const [chosenManufacturers, setChosenManufacturers] = useState(props.value.manufacturer_filter);
    const [updater, setUpdater] = useState(0);
    const suggestionSize = 5;
    const bd = (
        <div>
        <SuggestionSearcher searchTerm={chosenSuggestion ? chosenSuggestion.name : null} 
        recommends={[...searchResults.keys()]} onSearch={handleSearch} 
        onClickSuggestion={handleClickSuggestion} size={suggestionSize} updater={updater}/>
        {chosenSuggestion && 
        <div>
            <div>Name: {chosenSuggestion.name}</div>
            <div>ID: {chosenSuggestion.id}</div>
        </div>
        }
        <ManufacturerList manufacturers={props.value.found_manufacturers} 
        chosenManufacturers={chosenManufacturers} 
        onChangeManufacturers={handleChangeManufacturer}/>
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
    function handleSaveManufacturers(){
        const chosen = chosenManufacturers === null ? props.value.found_manufacturers : 
        [...chosenManufacturers];
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
        {
            props.manufacturers.map((manu, i) => 
            <LabeledCheckbox key={i} label={manu} id={manu} className='Pointer'
            checked={manufacturersCheckboxes[manu]} disabled={false}
            onChange={handleChangeManufacturer(manu)}/>
            )
        }
        </>
    );
}