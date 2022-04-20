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
    console.log(props.store);
    const flags = {
        'AU': <Flags.AU className='Flag'/>,
        'MY': <Flags.MY className='Flag'/>
    }
    const [store, setStore] = useState(props.store);
    const [currency, setCurrency] = useState(props.currency);
    const [hideCounter, setHideCounter] = useState(0);
    const activator = (
        <div className='Select'>
        {flags[props.store]}/{props.currency}
        </div>
    )
    useEffect(() => {
        setStore(props.store);
        setCurrency(props.currency);
    }, [props.store, props.currency])
    function handleStoreChange(st){
        setStore(st);
    }
    function handleCurrencyChange(curr){
        setCurrency(curr);
    }
    const body = (
        <div>
            <StoreCurrencyBody onStoreChange={handleStoreChange} 
            onCurrencyChange={handleCurrencyChange}
            stores={props.stores} store={props.store}
            currencies={props.currencies} currency={props.currency}/>
        </div>
    )
    function submitOptions(){
        console.log(store);
        props.onOptionChange(store, currency);
        setHideCounter(hideCounter+1);
    }
    const footer = (
        <div>
            <Button disabled={!props.dataProcessLock} onClick={submitOptions}>Submit</Button>
        </div>
    )
    return (
        <div>
            <ModalController hide={hideCounter} activateModal={activator} 
            body={body} footer={footer}/>
        </div>
    )
}

function StoreCurrencyBody(props){
    const serverUrl = useServerUrl();
    const [rates, setRates] = useState(props.currencies.map((currs) => {
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
            const newRates = rates.map(r => {
                return {
                    id: r.id,
                    rate: response.data.conversion_rates[r.id]
                }
            });
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
            <SelectSingleRadioButtons onChange={props.onStoreChange} options={props.stores} 
            init={props.store}/>
        </div>
        <div className='FlexNormal'>
            Currency
            <SelectSingleRadioButtons onChange={props.onCurrencyChange} options={props.currencies}
            init={props.currency}/>
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