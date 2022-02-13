//import {useState, useEffect} from 'react';

import ProgressBar from 'react-bootstrap/ProgressBar'

export function SimpleProgressBar(props){
    return (
        <ProgressBar now={props.now}/>
    );
}