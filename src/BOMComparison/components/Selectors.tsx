import React, {useEffect, useState, useRef} from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { SimpleDropdown } from '../../components/Dropdown';

type SelectPrimaryProps = {
    onSelect: (field:string) => void;
    fields: string[];
}

export function SelectPrimaryField(props:SelectPrimaryProps):JSX.Element{
    function handleSelect(field:string, _index:number){
        props.onSelect(field);
    }
    return (
        <div>
            <SelectDropdown items={props.fields} onChange={handleSelect}/>
        </div>
    );
}

type SelectStringDropdown = {
    items: string[];
    selected?: string;
    onChange?: (selected:string, index:number) => void;
}

export function SelectDropdown(props:SelectStringDropdown){
    const [selected, setSelected] = useState(props.items.length > 0 ? props.items[0] : null);
    useEffect(() => {
        if(props.selected) setSelected(props.selected);
    }, [props.selected]);
    //console.log(selected);
    function handleChange(item:string, i:number){
        setSelected(item);
        if(props.onChange) props.onChange(item, i);
    }
    return (
        <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                {selected}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{maxHeight: '300px', overflow: 'auto'}}>
                {props.items.map((item, i) => 
                    <Dropdown.Item key={i} onClick={() => handleChange(item, i)}>{item}</Dropdown.Item>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
}

type ObjectDropdownProps<T> = {
    selected?: T
    items: T[];
    item_key: keyof T;
    onChange: (item:T, item_no:number) => void;
  }
  
  export function ObjectDropdown<T>(props: ObjectDropdownProps<T>){
    const [selected, setSelected] = useState<T | undefined>(props.items.length > 0 ? props.items[0] : undefined);
    useEffect(() => {
      if(props.selected !== undefined){
        setSelected(props.selected);
      }
    }, [props.selected])
    function handleChange(item:T, item_no:number){
      setSelected(item);
      if(props.onChange) props.onChange(item, item_no);
    }
    return(
      <>
      <Dropdown>
        <Dropdown.Toggle variant="success" id="dropdown-basic">
          {selected && selected[props.item_key]}
        </Dropdown.Toggle>
        <Dropdown.Menu style={{maxHeight: '300px', overflow: 'auto'}}>
          {props.items.map((item, i) => 
            <Dropdown.Item key={i} onClick={() => handleChange(item, i)}>{item[props.item_key]}</Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
      </>
    );
  }