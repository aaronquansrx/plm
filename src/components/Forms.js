import {useEffect, useState} from 'react';
import update from 'immutability-helper';
import Form from 'react-bootstrap/Form';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';

import './../css/main.css';

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
        if(props.onBlur){
            const blur = props.onBlur(e.target.value);
            if(!isNaN(blur)){
                setNumber(blur);
            }
        }
    }
    useEffect(() => {
        setNumber(props.value);
    }, [props.value]);
    const disabled = props.disabled ? props.disabled : false;
    //const n = props.value !== null ? props.value : number;
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

export function TextInput(props){
    const [text, setText] = useState(props.value ? props.value : '');
    function handleChange(e){
        setText(e.target.value);
        if(props.onChange) props.onChange(e.target.value);
    }
    function handleBlur(e){
        if(props.onBlur) props.onBlur(e.target.value);
    }
    const disabled = props.disabled ? props.disabled : false;
    return (
        <div>
        {props.label && 
            <Form.Label>{props.label}</Form.Label>
        }
        <Form.Control type="text" autoFocus={props.focus}
        onChange={handleChange} onBlur={handleBlur} value={text}
        disabled={disabled}/>
        </div>
    );
}

export function SelectorForm(props){
    function handleBlur(e){
        if(props.onBlur) props.onBlur(e);
    }
    function handleChange(e){
        if(props.onSelect) props.onSelect(e);
    }
    return (
        <Form.Select autoFocus={true} onBlur={handleBlur} onChange={handleChange}>
            {props.options.map((option,i) => 
            <option key={i}>{option}</option>
            )}
        </Form.Select>
    );
}

export function AddRemoveEditSelectorForm(props){
    const [chosenEdit, setChosenEdit] = useState(null);
    const [selectValue, setSelectValue] = useState('');
    function handleBlur(e){
        if(props.onBlur) props.onBlur(e);
    }
    function handleChange(e){
        if(props.onSelect) props.onSelect(e);
        setSelectValue(e.target.value);
    }
    function handleEdit(e){
        if(props.onEdit) props.onEdit(e);
        setSelectValue(e);
    }
    return (
        <div>
        {props.edit ? <TextInput focus onBlur={handleEdit} value={props.selected}/> :
        <Form.Select disabled={props.disabled} value={selectValue} autoFocus={true} onBlur={handleBlur} onChange={handleChange}>
            {props.options.map((option,i) => 
            <option key={i} value={option}>{option}</option>
            )}
            <option value='addNew'>Add New</option>
        </Form.Select>
        }
        </div>
    )
}

export function FormAlign(props){
    return(
        <Form>
            {props.children}
        </Form>
    );
}

export function OutsideControlCheckbox(props){
    function handleChange(e){
        if(props.onChange){
            props.onChange(!props.checked);
        }
    }
    return(
        <Form.Check className={props.className} checked={props.checked} onChange={handleChange}/>
    ); 
}

export function LabeledCheckbox(props){
    //const [checked, setChecked] = useState(false);
    function handleChange(e){
        if(props.onChange){
            props.onChange(!props.checked);
        }
    }
    return(
        <Form.Check className={props.className} type={'checkbox'} id={props.id}
        checked={props.checked} onChange={handleChange} label={props.label} disabled={props.disabled}/>
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
            checked={selected===opt.id} onChange={handleChange} disabled={props.disabled}/>
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
        const newSelected = props.control 
        ? update(props.control, {
            [e.target.id]: {$set: !props.control[e.target.id]}
        })
        : update(selected, {
            [e.target.id]: {$set: !selected[e.target.id]}
        });
        setSelected(newSelected);
        if(props.onChange) props.onChange(newSelected);
    }
    return(
        <>
        {props.options.map((opt, i) => {
            const ch = props.control ? props.control[opt.id] : selected[opt.id];
            return(
            <Form.Check key={i} className={props.className} type='checkbox' {...opt} 
            checked={ch} onChange={handleChange}/>
            );
        })}
        </>
    );
}

export function ToggleSwitch(props){
    //const [toggleState, setToggleState] = useState(false);
    //console.log(props.onLabel);
    function handleChange(b){
        //setToggleState(b);
        if(props.onChange) props.onChange(b);
    }
    //console.log(props.disabled);
    return(
        <BootstrapSwitchButton onChange={handleChange} checked={props.checked} 
        onlabel={props.onLabel} offlabel={props.offLabel}
        onstyle={props.onStyle} offstyle={props.offStyle}/>
    )
}   

export function NameForm(props){
    //const [saveName, setSaveName] = useState('');
    function handleChange(v){
        props.changeName(v);
    }
    return(
        <Form>
            <TextInput focus label={props.label} onChange={handleChange} value={props.value}/>
        </Form>
    );
}

export function LoginForm(props){
    function handleUsernameChange(e){
        props.changeUsername(e.target.value);
    }
    function handlePasswordChange(e){
        props.changePassword(e.target.value);
    }
    return(
    <Form>
        <Form.Group className="mb-3" controlId="formBasicUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control type="input" placeholder="Enter username" 
            onChange={handleUsernameChange}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Password (Not Required Currently)" 
            onChange={handlePasswordChange}/>
        </Form.Group>
    </Form>
    );
}