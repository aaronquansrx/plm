import {useState, useEffect, useRef} from 'react';

//requires list of buttons {label, id}
//a selected button {label, id}
//onHold event
//onDrop event

function DragButtonGroup(props){
    //const [selectedButton, setSelectedButton] = useState(null);
    //const [mouse, setMouse] = useState({x: 0, y: 0});
    const [buttonMousePos, setButtonMousePos] = useState(0);
    function deselectButton(e){
        if(props.onDrop) props.onDrop(e);
        //setSelectedButton(null);
    }
    useEffect(() => {
        //window.addEventListener('mouseup', deselectButton);
        return () => {
            //window.removeEventListener('mouseup', deselectButton);
        }
    }, []);
    const mouse = useMousePosition();
    function handleHoldButton(i){
        return function(e){
            if(props.onHold) props.onHold(props.buttons[i]);
            //setSelectedButton(props.buttons[i]);
            const mx = e.nativeEvent.offsetX;
            const my = e.nativeEvent.offsetY;
            setButtonMousePos({x: mx, y: my});
        }
    }
    const sty = {
        position: 'fixed', 
        top: (mouse.y-buttonMousePos.y).toString()+'px', 
        left: (mouse.x-buttonMousePos.x).toString()+'px'
    }
    return(
        <>
            {props.selectedButton && 
                <Button variant='info' id='DropButton' onMouseUp={deselectButton}
                style={sty} 
                >{props.selectedButton.label}</Button>
            }
            {props.buttons.map((but, i) => {
                return <Button variant='info' key={i} onMouseDown={handleHoldButton(i)}>{but.label}</Button>
            })}
        </>
    );
}
