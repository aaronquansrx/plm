import React from 'react';

import { Dropdown } from 'react-bootstrap';

export function SimpleDropdown(props){
    return (
        <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                {props.selected}
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {props.items.map((item, i) => 
                    <Dropdown.Item key={i} onClick={() => props.onChange(item)}>{item}</Dropdown.Item>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export function BomDropdown(props){
    function handleChange(i){
        return function(){
            props.onChange(i);
        }
    }
    return(
        <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                {props.selectedBom && props.selectedBom.name}
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {props.boms.map((bom, i) => {
                    //if(bom.id !== props.selectedBom.id){
                        return <Dropdown.Item key={i} onClick={handleChange(i)}>{bom.name}</Dropdown.Item>;
                    //}
                    return <></>;
                })}
            </Dropdown.Menu>
        </Dropdown>
    );
}