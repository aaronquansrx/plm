import {useEffect, useState} from 'react';

import Form from 'react-bootstrap/Form';

import './../css/temp.css';

export function NumberInput(props){
    const [number, setNumber] = useState(1);
    const displayNumber = props.value ? props.value : number;
    function handleChange(e){
        if(!isNaN(e.nativeEvent.data)){
            //console.log(e.nativeEvent.data);
            setNumber(e.target.value);
            if(props.onChange) props.onChange(e.target.value);
        }
    }
    return(
        <div className='Hori'>
        {props.label && 
        <Form.Label>{props.label}</Form.Label>
        }
        <Form.Control className='SmallText' type="text" onChange={handleChange} value={displayNumber}/>
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