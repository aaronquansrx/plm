import React, {useState} from 'react';

import { TextInput } from './Forms';
import { Dropdown } from 'react-bootstrap';

import './../css/main.css'

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

export function MPNDropdown(props){
    function handleEditAddInput(e){
        if(props.isAdd){
            if(props.onAdd) props.onAdd(e);
        }else{
            if(props.onEdit) props.onEdit(e);
        }
    }
    function handleClick(e){
        return function(){
            if(props.onSelect) props.onSelect(e);
        }
    }
    return(
        <div>
        {props.edit ? <TextInput focus onBlur={handleEditAddInput} value={props.isAdd ? '' : props.selected}/>
        :
            <Dropdown>
                <Dropdown.Toggle variant='primary' id="dropdown-basic">
                    <span className='TextCursor'>{props.selected}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    {props.options.map((item, i) => 
                        <Dropdown.Item key={i} onClick={handleClick(item)}>{item}</Dropdown.Item>
                    )}
                    <Dropdown.Item className='AddNewItem' value='addNew'  onClick={handleClick('addNew')}>Add New</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        }
        </div>
    )
}