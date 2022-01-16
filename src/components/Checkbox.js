import React, {useEffect, useState} from 'react';

export function NamedCheckBox(props){
    const disabled = props.disabled ? props.disabled : false;
    return(
    <div>
    <label htmlFor={props.value}><span>{props.label}</span></label>
    <input id={props.value} className="form-check-input" type="checkbox" value={props.value} 
    checked={props.checked} onChange={props.onChange} disabled={disabled}/>
    </div>
    );
}

export function IdCheckbox(props){
    function handleChange(){
        props.onChange(props.i);
    }
    return (
        <input className="form-check-input" type="checkbox" value={props.key} checked={props.checked} onChange={handleChange}/>
    );
}