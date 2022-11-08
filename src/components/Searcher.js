import {useState, useEffect, useMemo} from 'react';

import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';

import axios from 'axios';

import './../css/main.css';

export function SuggestionSearcher(props){
    //const recommends = props.
    const [searchText, setSearchText] = useState('');
    useEffect(() => {
        if(props.searchTerm !== null){
            setSearchText(props.searchTerm);
        }
    }, [props.searchTerm, props.updater]);
    function handleChangeTerm(e){
        setSearchText(e.target.value);
        props.onSearch(e.target.value);
    }
    function handleClickSuggestion(reco){
        return function(){
            props.onClickSuggestion(reco);
        }
    }
    const size = props.size ? props.size : 5;
    const recoLength = size < props.recommends.length ? size : props.recommends.length;
    return(
        <>
        <Form.Control
            type='text'
            placeholder='Search Manufacturers'
            onChange={handleChangeTerm}
            value={searchText}
            //onKeyDown={handleKeyDown}
        />
        {props.recommends.length > 0 && 
        <ListGroup className='Pointer'>
            {[...Array(recoLength).keys()].map((i) => {
                const reco = props.recommends[i];
                return <ListGroup.Item  key={i} onClick={handleClickSuggestion(reco)}>{reco}</ListGroup.Item>;
            })}
        </ListGroup>
        }
        </>
    );
}