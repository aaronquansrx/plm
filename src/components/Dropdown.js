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