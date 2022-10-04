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

import './../css/main.css';

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
    const [statusMessage, setStatusMessage] = useState('');
    function handleChangeTerm(e){
        setSearchTerm(e.target.value);
    }
    function handleSearch(){
        setMpn(searchTerm);
        setStatusMessage('Loading...');
        setResults([]);
        axios({
            method: 'GET',
            url: serverUrl+'api/part',
            params: {part: searchTerm}
        }).then(res => {
            console.log(res.data);
            let hasOffers = false;
            const apiData = res.data.apis;
            const parsedApiData = Object.entries(apiData).reduce((arr, [api, data]) => {
                if(data.offers.length > 0){
                    const dt = {
                        distributor: apiNameMap[api],
                        offers: data.offers
                    }
                    arr.push(dt);
                    hasOffers = true;
                }
                return arr;
            }, []);
            const statusMess = hasOffers ? '' : 'No Offers Found';
            setStatusMessage(statusMess);
            console.log(parsedApiData);
            setResults(parsedApiData);
        });
    }
    function handleKeyDown(e){
        if(e.key == 'Enter'){
            handleSearch();
        }
    }
    return(
        <div>
        <div><h4>Single Part Request</h4></div>
        <div className='MPNRequest'>
            <Form.Control
            type="text"
            placeholder="MPN (exact match)"
            onChange={handleChangeTerm}
            onKeyDown={handleKeyDown}
            />
            <Button variant="outline-success" onClick={handleSearch}>Request</Button>
        </div>
        {mpn && <div>API Request Data for <b>{mpn}</b></div>}
        <SingleAPITable apiAttrs={apiAttrs} data={results} stockMode='in_stock'/>
        <div>{statusMessage}</div>
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