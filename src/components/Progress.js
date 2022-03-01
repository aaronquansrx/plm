import {useState, useEffect} from 'react';

import ProgressBar from 'react-bootstrap/ProgressBar';

import './../css/main.css';

export function SimpleProgressBar(props){
    return (
        <ProgressBar className='ProgressBar' now={props.now}/>
    );
}
export function BomApiProgressBar(props){
    const [percentage, setPercentage] = useState(0);
    //if(showProgress){
    useEffect(() => {
        const nFinished = props.bomApiProgress.reduce((n, api_list) => {
            if(api_list !== null && api_list.length === 0) return n+1;
            return n
        }, 0);
        const ratio = nFinished/props.numParts;
        const per = ratio*100;
        setPercentage(per);
        //console.log()
        if(ratio >= 1){
            setTimeout(() => props.onHideBar(), 3000);
        }
    }, [props.bomApiProgress]);
    return (
        <div>
        {props.show && <SimpleProgressBar now={percentage}/>}
        </div>
    );
}