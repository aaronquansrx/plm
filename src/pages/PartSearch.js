import React, {useEffect, useState} from 'react';

import axios from 'axios';

import { SingleAPITable } from '../components/BOMAPITable';
import { evalApisV2 } from '../hooks/BOMTable';

import {LabeledCheckbox, NumberInput} from '../components/Forms';
import {TemplateModal} from '../components/Modals';

import Modal from 'react-bootstrap/Modal';
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
    {Header: 'Packaging', accessor: 'packaging'},
    {Header: 'Manufacturer', accessor: 'manufacturer'}
];

function SingleApiSearch(props){
    const serverUrl = useServerUrl();
    const [results, setResults] = useState([]);
    const [data, setData] = useState(new Map());
    const [octoData, setOctoData] = useState(new Map());
    const [shownDistributors, setShownDistributors] = useState([]);
    const [resultOrder, setResultOrder] = useState([]);
    //manufacturers
    const [dataManufacturers, setDataManufacturers] = useState(new Set());
    const [octoManufacturers, setOctoManufacturers] = useState(new Set());
    const [offerManufacturers, setOfferManufacturers] = useState([]); // total manufacturers as array
    const [activeManufacturers, setActiveManufacturers] = useState(new Set());
    const [manufacturersModal, setManufacturersModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mpn, setMpn] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [includeOctopart, setIncludeOctopart] = useState(false);
    const [quantity, setQuantity] = useState(1);
    useEffect(() => {
        console.log(data);
    }, [data, shownDistributors]);
    useEffect(() => {
        updateResults();
        /*
        const newResults = Object.values(apiNameMap).reduce((arr, api) => {
            if(data.has(api)){
                const offers = data.get(api).reduce((ar, offer) => {
                    if(activeManufacturers.has(offer.manufacturer)){
                        ar.push(offer);
                    }
                    return ar;
                }, []);
                const dt = {
                    distributor: api,
                    offers: offers
                }
                arr.push(dt);
            }
            return arr;
        }, []);
        setResults(newResults);
        */
    }, [activeManufacturers]);
    useEffect(() => {
        const combManus = [...new Set([...dataManufacturers, ...octoManufacturers])];
        setOfferManufacturers(combManus);
    }, [dataManufacturers, octoManufacturers]);
    function updateResults(newData=null, newOctoData=null, am=null){
        const dataMap = newData !== null ? newData : data;
        const octoDataMap = newOctoData !== null ? newOctoData : octoData;
        const actManus = am !== null ? am : activeManufacturers;
        function getResults([key, val]){
            console.log(val);
            console.log(key);
            const offers = val.reduce((ar, offer) => {
                if(actManus.has(offer.manufacturer)){
                    ar.push(offer);
                }
                return ar;
            }, []);
            const dt = {
                distributor: key,
                offers: offers
            }
            return dt;
        }
        const dataResults = [...dataMap.entries()].map(getResults);
        const octoDataResults = [...octoDataMap.entries()].map(getResults);
        const mainResults = dataResults.concat(octoDataResults);
        console.log(mainResults);
        setResults(mainResults);
    }
    function handleChangeTerm(e){
        setSearchTerm(e.target.value);
    }
    function handleSearch(){
        setMpn(searchTerm);
        setStatusMessage('Loading...');
        //setData(new Map());
        setResults([]);
        //requestPart(); //without manufacturer
        requestMpn();
        if(includeOctopart){
            axios({
                method: 'GET',
                url: serverUrl+'api/octopart',
                params: {part: searchTerm}
            }).then(res => {
                console.log(res.data);
                const newData = new Map();
                const manuSet = new Set();
                res.data.data.sellers.forEach((seller) => {
                    //if(!apiNameSet.has(seller.distributor) || !data.has(seller.distributor)){
                    //    console.log(seller);
                    if(focusedOctoSet.has(seller.distributor)){
                        const manu = res.data.first_part.manufacturer;
                        const offers = seller.offers.map((offer) => {
                            offer.manufacturer = manu;
                            return offer;
                        });
                        newData.set(seller.distributor, offers);
                        manuSet.add(manu);
                    }
                    //}

                });
                setOctoData(new Map([...octoData]));
                updateResults(null, octoData, new Set());
            });
        }
    }

    function requestMpn(){
        axios({
            method: 'GET',
            url: serverUrl+'api/part',
            params: {mpn: searchTerm}
        }).then(res => {
            if(typeof res.data !== 'object'){
                console.log(res.data);
                setStatusMessage('Part Search Error');
            }else{
                console.log(res.data);
                let hasOffers = false;
                const apiData = res.data.refined.apis;
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
                console.log(newData);
                const manus = res.data.refined.found_manufacturers;
                setOfferManufacturers(manus);
                setData(new Map([...newData]));
                const statusMess = hasOffers ? '' : 'No Offers Found';
                setStatusMessage(statusMess);
                updateResults(newData, null, new Set(manus));
                //setResults(results.concat(parsedApiData));
            }
        });
    }
    function handleKeyDown(e){
        if(e.key == 'Enter'){
            handleSearch();
        }
    }
    function handleOpenDetails(){
        window.open('/partdetails/'+mpn, '_blank');
    }
    function showManuModal(){
        setManufacturersModal(true);
    }
    function closeManuModal(){
        setManufacturersModal(false);
    }
    function changeActiveManufacturers(activeManufacturers){
        setActiveManufacturers(activeManufacturers);
    }
    function handleQuantity(q){
        //console.log(q);
        //console.log(results);
        setQuantity(q);
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
        <Button onClick={showManuModal}>Show/Hide Manufacturers</Button>
        <ManufacturerModal show={manufacturersModal} manufacturers={offerManufacturers} onClose={closeManuModal} changeManufacturers={changeActiveManufacturers}/>
        </div>
        <span className='Hori' style={{justifyContent: 'center'}}><NumberInput label='Quantity:' onBlur={handleQuantity}/></span>
        {mpn && 
        <><div>API Request Data for <b>{mpn}</b> 
        <Button onClick={handleOpenDetails}>Details</Button>
        </div>
        <div>
        </div></>
        }
        <SingleAPITable apiAttrs={apiAttrs} data={results} quantity={quantity} stockMode='in_stock' displayManufacturers={offerManufacturers}/>
        <div>{statusMessage}</div>
        </div>
    )
}

function ManufacturerModal(props){
    const [manufacturersCheckboxes, setManufacturersCheckboxes] = useState(props.manufacturers.reduce((obj, manu) => {
        obj[manu] = true;
        return obj;
    }, {}));
    useEffect(() => {
        setManufacturersCheckboxes(props.manufacturers.reduce((obj, manu) => {
            obj[manu] = true;
            return obj;
        }, {}));
    }, [props.manufacturers]);
    function handleChangeManufacturer(manu){
        return function(){
            const newCheckboxes = {...manufacturersCheckboxes};
            newCheckboxes[manu] = !newCheckboxes[manu];
            setManufacturersCheckboxes(newCheckboxes);
            const checkedSet = new Set(Object.entries(newCheckboxes).reduce((arr, [key, val]) => {
                if(val) arr.push(key);
                return arr;
            }, []));
            props.changeManufacturers(checkedSet);
        }
    }
    const body = (
        <>
        {props.manufacturers.map((manu, i) => {
            return <LabeledCheckbox key={i} label={manu} id={manu} className='Pointer' 
            checked={manufacturersCheckboxes[manu]} onChange={handleChangeManufacturer(manu)}/>
        })}
        </>
    );
    return(
        <TemplateModal show={props.show} title='Show/Hide Manufacturers' body={body} onClose={props.onClose}/>
    );
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