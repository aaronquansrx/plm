import {useState, useEffect} from 'react';

import BOMToolSettings from './../components/BOMToolSettings';
import { DragAdjustColumnTable } from '../components/Tables';

export default function Test(props){

    useEffect(() => {
        
    }, []);
    return(
        <div>
            Testing
            <BOMToolSettings apiAttributes={[]}/>
            <DragAdjustColumnTable/>
        </div>
    );
}