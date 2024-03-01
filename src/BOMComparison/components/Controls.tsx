import React, {useEffect, useState} from 'react';

type SelectCheckboxProps = {
    checked: boolean;
    onChange:() => void;
    //id: number;
}

export function SelectCheckbox(props:SelectCheckboxProps){
    function handleChange(){
        if(props.onChange) props.onChange();
    }
    return (
        <input className="form-check-input" type="checkbox" checked={props.checked} onChange={handleChange}/>
    );
}