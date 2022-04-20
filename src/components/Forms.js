import {useEffect, useState} from 'react';
import update from 'immutability-helper';
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

export function SelectSingleRadioButtons(props){
    const init = props.init ? props.init
    : props.options.length > 0 ? props.options[0].id : null;
    const [selected, setSelected] = useState(init);
    const seValue = props.selected ? props.selected : selected;
    function handleChange(e){
        const selValue = selected === e.target.id ? null : e.target.id;
        setSelected(selValue);
        if(props.onChange) props.onChange(selValue);
    }
    return(
        <>
        {props.options.map((opt, i) => 
            <Form.Check key={i} type='radio' {...opt} 
            checked={selected===opt.id} onChange={handleChange}/>
        )}
        </>
    );
}

export function MultiSelectRadioButtons(props){
    const init = props.options && props.init ? props.init 
    : props.options.reduce((obj, opt) => {
        obj[opt] = false;
        return obj;
    }, {});
    const [selected, setSelected] = useState(init);
    function handleChange(e){
        const newVal = !selected[e.target.id];
        const newSelected = update(selected, {
            [e.target.id]: {$set: newVal}
        });
        setSelected(newSelected);
        if(props.onChange) props.onChange(newSelected);
    }
    return(
        <>
        {props.options.map((opt, i) => 
            <Form.Check key={i} type='checkbox' {...opt} 
            checked={selected[opt.id]} onChange={handleChange}/>
        )}
        </>
    );
}