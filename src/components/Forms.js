import {useEffect, useState} from 'react';

import Form from 'react-bootstrap/Form';

import './../css/temp.css';

export function NumberInput(props){
    const [number, setNumber] = useState(props.value ? props.value : 1);
    //const displayNumber = props.value ? props.value : number;
    function handleChange(e){
        if(!isNaN(e.nativeEvent.data)){
            //console.log(e.nativeEvent.data);
            setNumber(e.target.value);
            if(props.onChange) props.onChange(e.target.value);
        }
    }
    function handleBlur(e){
        if(props.onBlur) props.onBlur(e.target.value);
    }
    useEffect(() => {
        setNumber(props.value);
    }, [props.value]);
    const disabled = props.disabled ? props.disabled : false;
    return(
        <div className='Hori'>
        {props.label && 
        <Form.Label>{props.label}</Form.Label>
        }
        <Form.Control className='SmallText' type="text" 
        onChange={handleChange} onBlur={handleBlur} value={number}
        disabled={disabled}/>
        </div>
    );
}

export function FormAlign(props){
    return(
        <Form>
            {props.children}
        </Form>
    );
}