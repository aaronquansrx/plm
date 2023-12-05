import {useState, useEffect, useMemo, useRef} from 'react';

import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import axios from 'axios';

import './../css/main.css';
import { OutsideClickFunction } from '../hooks/InterfaceHelpers';

export function SuggestionSearcher(props){
    //const recommends = props.
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    //const [inputHeight, setInputHeight] = useState(0);
    const textInput = useRef(null);
    useEffect(() => {
        if(!(props.searchTerm === null || props.searchTerm === undefined)){
            setSearchText(props.searchTerm);
        }
    }, [props.searchTerm, props.updater]);
    function handleChangeTerm(e){
        const term = e.target.value
        if(term !== '' || props.showBaseSuggestions){
            setShowSuggestions(true);
        }
        setSearchText(term);
        if(props.onSearch) props.onSearch(term);
    }
    function handleClickSuggestion(reco, i){
        return function(){
            if(props.onClickSuggestion) props.onClickSuggestion(reco, i);
            setShowSuggestions(false);
            setSearchText('');
        }
    }
    function handleClickOutside(){
        setShowSuggestions(false);
    }
    const size = props.size ? props.size : 5;
    const recoLength = size < props.recommends.length ? size : props.recommends.length;
    //console.log(searchText);
    return(
        <>
        <OutsideClickFunction func={handleClickOutside}>
        {<Form.Control
            type='text'
            placeholder={props.placeholder ? props.placeholder : ''}
            onChange={handleChangeTerm}
            onFocus={handleChangeTerm}
            value={searchText}
            //onKeyDown={handleKeyDown}
            ref={textInput}
        />}
        {props.recommends.length > 0 && showSuggestions && 
        <ListGroup className='Pointer' style={
            {position: 'absolute', zIndex: 10, maxHeight: '200px', overflowY: 'auto'}
        }>
            {[...Array(recoLength).keys()].map((i) => {
                const reco = props.recommends[i];
                return <ListGroup.Item key={i} onClick={handleClickSuggestion(reco, i)}>{reco}</ListGroup.Item>;
            })}
        </ListGroup>
        }
        </OutsideClickFunction>
        </>
    );
}

export function IndexSearcher(props){
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const textInput = useRef(null);
    useEffect(() => {
        if(!(props.searchTerm === null || props.searchTerm === undefined)){
            setSearchText(props.searchTerm);
        }
    }, [props.searchTerm, props.updater]);
    function handleChangeTerm(e){
        const term = e.target.value
        if(term !== ''){
            setShowSuggestions(true);
        }
        setSearchText(term);
        if(props.onSearch) props.onSearch(term);
    }
    function handleClickSuggestion(reco){
        return function(){
            if(props.onClickSuggestion) props.onClickSuggestion(reco);
        }
    }
    function handleClickOutside(){
        setShowSuggestions(false);
    }
    const size = props.size ? props.size : 5;
    const recoLength = size < props.recommends.length ? size : props.recommends.length;
    return(
        <>
        <OutsideClickFunction func={handleClickOutside}>
        {<Form.Control
            type='text'
            placeholder={props.placeholder ? props.placeholder : ''}
            onChange={handleChangeTerm}
            onFocus={handleChangeTerm}
            value={searchText}
            ref={textInput}
        />}
        {props.recommends.length > 0 && showSuggestions && 
        <ListGroup className='Pointer' style={{position: 'absolute', zIndex: 10}}>
            {[...Array(recoLength).keys()].map((i) => {
                const reco = props.recommends[i];
                return <ListGroup.Item key={i} onClick={handleClickSuggestion(i)}>{reco}</ListGroup.Item>;
            })}
        </ListGroup>
        }
        </OutsideClickFunction>
        </>
    );
}


export function ButtonChooseSearcher(props){
    const [chosen, setChosen] = useState(null);
    function handleDeselect(){
        props.onDeselect();
    }
    function handleSearch(s){
        props.onSearch(s);
    }
    function handleClick(s){
        props.onClick(s);
    }
    return(
        <>
        {!props.chosen ? <IndexSearcher recommends={props.searchResults}
        onSearch={handleSearch} size={props.size ? props.size : 5} onClickSuggestion={handleClick}/>
        : <div><Button className='ChosenManufacturerButton' onClick={handleDeselect}>{props.name}</Button></div>
        }
        </>
    )
}

// recommendations are objects requiring name attribute
export function ObjectSuggestionSearcher(props){
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const textInput = useRef(null);
    useEffect(() => {
        if(props.searchTerm !== null && props.searchTerm !== undefined){
            setSearchText(props.searchTerm);
        }
    }, [props.searchTerm, props.updater]);
    function handleChangeTerm(e){
        const term = e.target.value
        if(term !== '' || props.showBaseSuggestions){
            setShowSuggestions(true);
        }
        setSearchText(term);
        props.onSearch(term);
    }
    function handleClickSuggestion(reco){
        return function(){
            if(props.onClickSuggestion) props.onClickSuggestion(reco);
            setShowSuggestions(false);
        }
    }
    function handleClickOutside(){
        setShowSuggestions(false);
    }
    const size = props.size ? props.size : 5;
    const recoLength = size < props.recommends.length ? size : props.recommends.length;
    const style = {position: 'absolute', zIndex: 10, maxHeight: '200px', overflowY: 'auto'}
    return(
        <>
        <OutsideClickFunction func={handleClickOutside}>
        <Form.Control
            type='text'
            placeholder={props.placeholder ? props.placeholder : ''}
            onChange={handleChangeTerm}
            onFocus={handleChangeTerm}
            value={searchText}
            //onKeyDown={handleKeyDown}
            ref={textInput}
        />
        {props.recommends.length > 0 && showSuggestions && 
        <ListGroup className='Pointer' style={style}>
            {[...Array(recoLength).keys()].map((i) => {
                const reco = props.recommends[i];
                return <ListGroup.Item key={i} onClick={handleClickSuggestion(reco)}>{reco.name}</ListGroup.Item>;
            })}
        </ListGroup>
        }
        </OutsideClickFunction>
        </>
    );
}