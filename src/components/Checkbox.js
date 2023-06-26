import React, {useEffect, useState} from 'react';

import './../css/temp.css';

export function NamedCheckBox(props){
    const disabled = props.disabled ? props.disabled : false;
    return(
    <div className={disabled ? '' : 'Pointer'}>
    <label htmlFor={props.value}><span>{props.label}</span></label>
    <input id={props.value} className="form-check-input" type="checkbox" value={props.value} 
    checked={props.checked} onChange={props.onChange} disabled={disabled}/>
    </div>
    );
}

export function IdCheckbox(props){
    function handleChange(){
        if(props.onChange) props.onChange(props.i);
    }
    return (
        <input className="form-check-input" type="checkbox" checked={props.checked} onChange={handleChange}/>
    );
}