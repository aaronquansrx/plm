import React, {useEffect, useState} from 'react';

import axios from 'axios';

import { SingleAPITable } from '../components/BOMAPITable';
import { evalApisV2 } from '../hooks/BOMTable';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';

import {useServerUrl} from '../hooks/Urls';
import { ListGroupItem } from 'react-bootstrap';
import { set } from 'lodash';

function PartSearch(props){
    return(
        <div>
            <SingleApiSearch/>
        </div>
    )
}

const apiNameMap = {
    'futureelectronics': 'Future Electronics',
    'verical': 'Verical',
    'digikey': 'Digikey',
    'mouser': 'Mouser',
    'element14': 'Element 14'
}

const apiAttrs = [
    {Header: 'Stock', accessor: 'available'},
    {Header: 'MOQ', accessor: 'moq', longHeader: 'Minimum Order Quantity'},
    {Header: 'SPQ', accessor: 'spq', longHeader: 'Standard Pack Quantity'},
    {Header: 'Lead Time', accessor: 'leadtime'},
    {Header: 'Price', accessor: 'pricing'},
    {Header: 'Fees', accessor: 'fees'},
    {Header: 'Dist. Code', accessor: 'distributor_code', longHeader: 'Distributor Code'},
    {Header: 'Packaging', accessor: 'packaging'}
];

function SingleApiSearch(props){
    const serverUrl = useServerUrl();
    const [results, setResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mpn, setMpn] = useState(null);
    function handleChangeTerm(e){
        setSearchTerm(e.target.value);
    }
    function handleSearch(){
        setMpn(searchTerm);
        axios({
            method: 'GET',
            url: serverUrl+'api/part',
            params: {part: searchTerm}
        }).then(res => {
            //console.log(res.data);
            const apiData = res.data.apis;
            const parsedApiData = Object.entries(apiData).reduce((arr, [api, data]) => {
                const dt = {
                    distributor: apiNameMap[api],
                    offers: data.offers
                }
                arr.push(dt);
                return arr;
            }, []);
            console.log(parsedApiData);
            setResults(parsedApiData);
        });
    }
    return(
        <div>
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
        <div>Single Part Search</div>
        {mpn && <div>API Data for <b>{mpn}</b></div>}
        <SingleAPITable apiAttrs={apiAttrs} data={results} stockMode='in_stock'/>
        </div>
    )
}

function OldPt(props){
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