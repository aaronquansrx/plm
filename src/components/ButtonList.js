import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import { ListGroup } from 'react-bootstrap';

export function ChooseButtonList(props){
    //const [chosen, setChosen] = useState('');
    const [list, setList] = useState(props.items);
    const [isOpen, setIsOpen] = useState(false);
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
    const [itemState, setItemState] = useState(props.state ? props.state : props.items.map(() => true));
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
            <ListGroup.Item key={i} className={'ToggleItem'} onClick={handleToggle(item, i)} active={itemState[i]}>
                {item}
            </ListGroup.Item>
            )}
        </ListGroup>
    );
}