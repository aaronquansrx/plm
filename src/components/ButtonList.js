import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import { ListGroup } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';

export function ChooseButtonList(props){
    //console.log(props.items)
    //const [chosen, setChosen] = useState('');
    const [list, setList] = useState(props.items);
    const [isOpen, setIsOpen] = useState(false);
    //console.log(props.items);
    useEffect(() => {
        setList(props.items);
    }, [props.items])
    useEffect(() => {
        const i = list.findIndex((v) => v === props.chosen);
        if(i !== -1){
            const newList = [...props.items];
            const rem = newList.splice(i, 1)[0];
            newList.unshift(rem);
            setList(newList);
        }
        const newList = list;
        const rem = newList.splice(props.chosenIndex, 1)[0];
        newList.unshift(rem);
        setList(newList);
    }, [props.chosen]);
    function toggleOpen(){
        setIsOpen(!isOpen);
    }
    function handleNewChosen(c, i){
        return function(){
            if(props.changeChosen){
                props.changeChosen(c);
                const newList = list;
                const rem = newList.splice(props.chosenIndex, 1)[0];
                newList.unshift(rem);
                setList(newList);
            }
            toggleOpen();
        }
    }
    return (
        <ListGroup style={{width: 'fit-content', cursor: 'pointer'}}>
            <ListGroup.Item onClick={toggleOpen}>{props.chosen}</ListGroup.Item>
            <div style={{position: 'absolute' , zIndex: '100'} }>
            { isOpen && list.map((item, i) => 
            <ListGroup.Item key={i} onClick={handleNewChosen(item, i)}>{item}</ListGroup.Item>
            )}
            </div>
        </ListGroup>
    )
}

export function ToggleButtonList(props){
    const [itemState, setItemState] = useState(getItemState());
    //console.log(props.items);
    useEffect(() => {
        if(props.itemsActive){
            //console.log(props.itemsActive);
            setItemState(getItemState());
        }
    }, [props.itemsActive]);
    function getItemState(){
        return props.itemsActive ? props.items.map((item) => {
            if(props.itemsActive.includes(item)) return true;
            return false;
        }) : props.items.map(() => true);
    }
    function handleToggle(item, i){
        return function(){
            if(props.onToggleItem) props.onToggleItem(item, i);
            const newItemState = update(itemState, {
                [i]: {$set: !itemState[i]}
            })
            setItemState(newItemState);
            const items = newItemState.reduce((arr, t, i) => {
                if(t) arr.push(props.items[i]);
                return arr;
            }, []);
            if(props.onChangeList) props.onChangeList(items);
        }
    }
    return(
        <ListGroup style={{width: 'fit-content', cursor: 'pointer'}}>
            {props.items.map((item, i) => 
            <ListGroup.Item key={i} className={'ToggleItem'} style={{minHeight: '40px'}} onMouseDown={handleToggle(item, i)} active={itemState[i]}>
                {item === '' ? ' ' : item}
            </ListGroup.Item>
            )}
        </ListGroup>
    );
}

export function ToggleButton(props){
    const [isOn, setIsOn] = useState(props.init ? props.init : false);
    function handleToggle(){
        const newOn = !isOn;
        if(props.onToggle) props.onToggle(newOn);
        setIsOn(newOn);
    }
    return(
        <ListGroup.Item className={'ToggleItem'} onClick={handleToggle} active={isOn}>
                {isOn ? (props.onText ? props.onText : props.children) : (props.offText ? props.offText : props.children)}
        </ListGroup.Item>
    );
}