import React, {useState, useEffect} from 'react';

import { TextInput } from './Forms';
import { Dropdown } from 'react-bootstrap';
import { OutsideClickFunction } from '../hooks/InterfaceHelpers';
import { ListGroup } from 'react-bootstrap';

import './../css/main.css'

export function SimpleDropdown(props){
    const [selected, setSelected] = useState(props.items.length > 0 ? props.items[0] : null);
    useEffect(() => {
        setSelected(props.selected);
    }, [props.selected]);
    function handleChange(item, i){
        setSelected(item);
        if(props.onChange) props.onChange(item, i);
    }
    return (
        <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                {selected}
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {props.items.map((item, i) => 
                    <Dropdown.Item key={i} onClick={() => handleChange(item, i)}>{item}</Dropdown.Item>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
}


export function LabelledDropdownList(props){
    function handleChange(item, i){
        if(props.onChange) props.onChange(item, i);
    }
    return(
    <Dropdown>
        <Dropdown.Toggle variant="success" id="dropdown-basic">
            {props.selected.label}
        </Dropdown.Toggle>

        <Dropdown.Menu>
            {props.items.map((item, i) => 
                <Dropdown.Item key={i} onClick={() => handleChange(item, i)}>{item.label}</Dropdown.Item>
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
        <Dropdown style={{position: 'inherit'}}>
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

/**
 * 
 * @param {items {name}, onSelect(itemIndex)} props 
 * @returns 
 */

export function ListSelectDropdown(props){
    const [open, setOpen] = useState(false);
    function handleClickOutside(){
        setOpen(false);
    }
    function handleOpen(){
        setOpen(true);
    }
    function handleSelect(e){
        const id = parseInt(e.target.id);
        //console.log(id);
        if(props.onSelect) props.onSelect(id);
        setOpen(false);
    }
    return (
        <OutsideClickFunction func={handleClickOutside}>
            <ListGroup className='Pointer' style={{position: 'absolute', zIndex: 10}}>
                {open ? props.items.map((it, i) => {
                    return <ListGroup.Item key={i} id={i} onClick={handleSelect}>{it.name}</ListGroup.Item>;
                }) : props.selected && <ListGroup.Item onClick={handleOpen} className='Pointer'>{props.selected.name}</ListGroup.Item>
                }
            </ListGroup>
        </OutsideClickFunction>
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