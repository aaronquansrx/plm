import {useState, useEffect} from 'react';

import BOMToolSettings from './../components/BOMToolSettings';

export default function Test(props){

    useEffect(() => {
        
    }, []);
    return(
        <div>
            Testing
            <BOMToolSettings apiAttributes={[]}/>
        </div>
    );
}