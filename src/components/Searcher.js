import {useState, useEffect, useMemo, useRef} from 'react';

import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';

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
        if(props.searchTerm !== null){
            setSearchText(props.searchTerm);
        }
    }, [props.searchTerm, props.updater]);
    function handleChangeTerm(e){
        const term = e.target.value
        if(term !== ''){
            setShowSuggestions(true);
        }
        setSearchText(term);
        props.onSearch(term);
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
        <ListGroup className='Pointer' style={{position: 'absolute', zIndex: 10}}>
            {[...Array(recoLength).keys()].map((i) => {
                const reco = props.recommends[i];
                return <ListGroup.Item key={i} onClick={handleClickSuggestion(reco)}>{reco}</ListGroup.Item>;
            })}
        </ListGroup>
        }
        </OutsideClickFunction>
        </>
    );
}

// recommendations are objects requiring name attribute
export function ObjectSuggestionSearcher(props){
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const textInput = useRef(null);
    useEffect(() => {
        if(props.searchTerm !== null){
            setSearchText(props.searchTerm);
        }
    }, [props.searchTerm, props.updater]);
    function handleChangeTerm(e){
        const term = e.target.value
        if(term !== ''){
            setShowSuggestions(true);
        }
        setSearchText(term);
        props.onSearch(term);
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
        <ListGroup className='Pointer' style={{position: 'absolute', zIndex: 10}}>
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