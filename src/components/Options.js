import {useState, useEffect} from 'react';

import axios from 'axios';

import ReactCountryFlag from "react-country-flag";
import Flags from 'country-flag-icons/react/3x2';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import {ModalController} from './Modals';
import { SelectSingleRadioButtons } from './Forms';

import {useServerUrl} from './../hooks/Urls';

import './../css/options.css';

export function StoreCurrencyOptions(props){
    const stores = [
        {id: 'AU', label: 'AU'},
        {id: 'MY', label: 'MY'}
    ];
    const currencies = [
        {id: 'USD', label: 'USD'},
        {id: 'AUD', label: 'AUD'},
        {id: 'MYR', label: 'MYR'}
    ];
    const flags = {
        'AU': <Flags.AU className='Flag'/>,
        'MY': <Flags.MY className='Flag'/>
    }
    //const [store, setStore] = useState(stores[0].id);
    //const [currency, setCurrency] = useState(currencies[0].id);
    const activator = (
        <div className='Select'>
        {flags[props.store]}/{props.currency}
        </div>
    )
    function handleStoreChange(st){
        props.onOptionChange('store', st);
    }
    function handleCurrencyChange(curr){
        props.onOptionChange('currency', curr);
    }
    const body = (
        <div>
            <StoreCurrencyBody onStoreChange={handleStoreChange} 
            onCurrencyChange={handleCurrencyChange}
            options={stores}/>
        </div>
    )
    const footer = (
        <div>
        </div>
    )
    return (
        <div>
            <ModalController activateModal={activator} 
            body={body} footer={footer}/>
        </div>
    )
}

function StoreCurrencyBody(props){
    const serverUrl = useServerUrl();
    const stores = [
        {id: 'AU', label: 'AU'},
        {id: 'MY', label: 'MY'}
    ];
    const currencies = [
        {id: 'USD', label: 'USD'},
        {id: 'AUD', label: 'AUD'},
        {id: 'MYR', label: 'MYR'}
    ];
    const [rates, setRates] = useState(currencies.map((currs) => {
        return {
            id: currs.id,
            rate: null
        };
    }));
    useEffect(() => {
        const controller = new AbortController();
        axios({
            method: 'GET',
            url: serverUrl+'api/currencyexchange',
            signal: controller.signal
        }).then(response => {
            console.log(response.data);
            const newRates = rates.map(r => {
                return {
                    id: r.id,
                    rate: response.data.conversion_rates[r.id]
                }
            });
            console.log(newRates);
            setRates(newRates);
        });
        return () => {
            controller.abort();
        }
    }, [])
    return(
        <div className='Hori'>
        <div className='FlexNormal'>
            Store
            <SelectSingleRadioButtons onChange={props.onStoreChange} options={stores}/>
        </div>
        <div className='FlexNormal'>
            Currency
            <SelectSingleRadioButtons onChange={props.onCurrencyChange} options={currencies}/>
        </div>
        <div className='FlexNormal'>
            Rates
            {rates.map((r,i) => {
                return <div key={i}>{r.rate}</div>
            })}
        </div>
        </div>
    )
}

/*
function StoreCurrencyModal(props){
    const handleClose = () => props.onClose();
    return(
        <Modal show={props.show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Export Excel</Modal.Title>
        </Modal.Header>

        <Modal.Body>
            File Name: <input type='text' value={fn} onChange={handleChange}/>
            <NamedCheckBox value='lowestPrice' label='Lowest Price' 
            onChange={handleOptionChange('lowestPrice')} checked={options.lowestPrice}/>
            <NamedCheckBox value='lowestLead' label='Lowest Lead' 
            onChange={handleOptionChange('lowestLead')} checked={options.lowestLead}/>
        </Modal.Body>

        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button variant="primary" onClick={handleExport}>Export</Button>
        </Modal.Footer>
        </Modal>
    )
}
*/