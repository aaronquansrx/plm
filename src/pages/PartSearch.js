import React, {useEffect, useState} from 'react';

import axios from 'axios';

import { SingleAPITable } from '../components/BOMAPITable';
import { evalApisV2 } from '../hooks/BOMTable';

import {LabeledCheckbox} from '../components/Forms';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';

import {useServerUrl} from '../hooks/Urls';
import { ListGroupItem } from 'react-bootstrap';

import './../css/main.css';
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
    'digikey': 'Digi-Key',
    'mouser': 'Mouser',
    'element14': 'Element 14'
}

const apiNameSet = new Set(Object.values(apiNameMap));

const focusedOctoSet = new Set(['RS Components']);

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
    const [data, setData] = useState(new Map());
    const [shownDistributors, setShownDistributors] = useState([]);
    const [resultOrder, setResultOrder] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mpn, setMpn] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [includeOctopart, setIncludeOctopart] = useState(false);
    useEffect(() => {
        console.log(data);
    }, [data, shownDistributors]);
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
            if(typeof res.data !== 'object'){
                console.log(res.data);
                setStatusMessage('Part Search Error');
            }else{
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
                const newData = new Map();
                Object.entries(apiData).forEach(([api, data]) => {
                    if(data.offers.length > 0){
                        hasOffers = true;
                        newData.set(apiNameMap[api], data.offers);
                    }
                });
                setData(new Map(...newData, ...data));
                const statusMess = hasOffers ? '' : 'No Offers Found';
                setStatusMessage(statusMess);
                setResults(results.concat(parsedApiData));
            }
        });
        if(includeOctopart){
            axios({
                method: 'GET',
                url: serverUrl+'api/octopart',
                params: {part: searchTerm}
            }).then(res => {
                console.log(res.data);
                const newData = new Map();
                res.data.data.sellers.forEach((seller) => {
                    if(!apiNameSet.has(seller.distributor) || !data.has(seller.distributor)){
                        console.log(seller);
                        newData.set(seller.distributor, seller.offers);
                    }
                });
                setData(new Map(...newData, ...data));
            });
        }
    }
    function handleKeyDown(e){
        if(e.key == 'Enter'){
            handleSearch();
        }
    }
    function handleOpenDetails(){
        window.open('/partdetails/'+mpn, '_blank');
    }
    return(
        <div>
        <div><h4>Single Part Request</h4></div>
        <div className='HoriCenter'>
        <span className='MPNRequest'>
            <Form.Control
            type="text"
            placeholder="MPN (exact match)"
            onChange={handleChangeTerm}
            onKeyDown={handleKeyDown}
            />
            <Button variant="outline-success" onClick={handleSearch}>Request</Button>
        </span>
        <span style={{padding: '5px'}}>
        <LabeledCheckbox label={'Include Octopart'} id={'includeOctopart'} className='Pointer'
            checked={includeOctopart} onChange={() => setIncludeOctopart(!includeOctopart)}/>
        </span>
        </div>
        {mpn && <div>API Request Data for <b>{mpn}</b> <Button onClick={handleOpenDetails}>Details</Button></div>}
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