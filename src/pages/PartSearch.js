import React, {useEffect, useState} from 'react';

import axios from 'axios';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';

import {useServerUrl} from '../hooks/Urls';
import { ListGroupItem } from 'react-bootstrap';

function PartSearch(props){
    const [results, setResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    function handleChangeTerm(e){
        setSearchTerm(e.target.value);
    }
    const server_url = useServerUrl();
    function handleSearch(){
        axios({
            method: 'get',
            url: server_url+'partsearch',
            params: {search: searchTerm}
        }).then(res => {
            console.log(res);
            setResults(res.data.results);
        });
    }
    return(
        <div>
        <div className='Login'>
            <Form className="d-flex">
                <Form.Control
                type="search"
                placeholder="Search"
                className="me-2"
                aria-label="Search"
                //value={searchTerm}
                onChange={handleChangeTerm}
                />
                <Button variant="outline-success" onClick={handleSearch}>Search</Button>
            </Form>
        </div>
        <div>
            {results.length} Results
            <ResultList results={results}/>
        </div>
        </div>
    )
}

function ResultList(props){
    function handleClick(mpn){
        return function(){
            window.open('/partdetails/'+mpn, '_blank');
        }
    }
    return (
        <ListGroup>
        {props.results.map((r,i) => {
            return(
            <ListGroupItem key={i} onClick={handleClick(r.name)}>
                {r.name}
            </ListGroupItem>
            );
        })}
        </ListGroup>
    );
}

export default PartSearch;