import {useState, useRef, useEffect} from 'react';

import Button from 'react-bootstrap/Button';
import Overlay from 'react-bootstrap/Overlay';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import './../css/temp.css';

export function HoverOverlay(props){
    const showTime = props.show ? props.show : 150;
    const hideTime = props.hide ? props.hide : 300;
    const target = useRef(null);
    const placement = props.placement ? props.placement : 'right';
    const tooltip = (p) => (
        <Tooltip id="button-tooltip" {...p}>
            {props.tooltip}
        </Tooltip>
    );
    return(
        <OverlayTrigger placement={placement} 
        delay={{ show: showTime, hide: hideTime }} overlay={tooltip}>
            <div ref={target}>
            {props.children}
            </div>
        </OverlayTrigger>
    );
}

export function WarningToolTipButtonFade(props){
    const [show, setShow] = useState(false);
    
    const target = useRef(null);
    const placement = props.placement ? props.placement : 'right';
    useEffect(() => {
        const timer = show ? setTimeout(() => setShow(false), 2000) : null;
        return () => {
            clearTimeout(timer);
        }
    });
    function handleClick(){
        const s = !show;
        setShow(s);
        props.onClick();
        /*
        if(s){
            setTimeout(() => setShow(false), 1000);
        }*/
    }
    return(
    <>
    <Button ref={target} onClick={handleClick}>
        {props.buttonText}
    </Button>
    <Overlay target={target.current} show={show} placement={placement}>
    {(p) => {
        //console.log(p);
        return(
        <Tooltip {...p}>
            {props.children}
        </Tooltip>
        );
    }}
    </Overlay>
    </>
    );
}

export function WarningToolTipButton(props){
    const [show, setShow] = useState(false);
    const target = useRef(null);
    const placement = props.placement ? props.placement : 'right';
    function handleClick(){
        setShow(!show);
        props.onClick();
    }
    return(
    <>
    <Button ref={target} onClick={handleClick}>
        {props.buttonText}
    </Button>
    <Overlay target={target.current} show={show} placement={placement}>
    {(p) => (
      <Tooltip {...p}>
        {props.children}
      </Tooltip>
    )}
    </Overlay>
    </>
    );
}