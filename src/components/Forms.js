import {useEffect, useState} from 'react';

import Form from 'react-bootstrap/Form';

import './../css/temp.css';

export function NumberInput(props){
    const [number, setNumber] = useState(props.value);
    //const displayNumber = props.value ? props.value : number;
    function handleChange(e){
        //console.log(e.target.value);
        if(!isNaN(e.nativeEvent.data)){
            //console.log(e.target.value);
            //console.log(e.nativeEvent.data);
            setNumber(e.target.value);
            if(props.onChange) props.onChange(e.target.value);
        }
    }
    function handleBlur(){
        if(props.onBlur) props.onBlur(number);
    }
    return(
        <div className='Hori'>
        {props.label && 
        <Form.Label>{props.label}</Form.Label>
        }
        <Form.Control className='SmallText' type="text" onChange={handleChange} onBlur={handleBlur} value={number}/>
        </div>
    );
}

export function DisabledInput(props){
    
}

export function SelectorForm(props){
    function handleBlur(e){
        if(props.onBlur) props.onBlur(e);
    }
    function handleChange(e){
        if(props.onSelect) props.onSelect(e);
    }
    return (
        <Form.Select autoFocus={true} onBlur={handleBlur} onChange={handleChange}>
            {props.options.map((option,i) => 
            <option key={i}>{option}</option>
            )}
        </Form.Select>
    );
}

export function FormAlign(props){
    return(
        <Form>
            {props.children}
        </Form>
    );
}