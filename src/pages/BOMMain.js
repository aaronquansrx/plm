import React, {useEffect, useState} from 'react';

import BOMInterface from './../containers/BOMInterface';
import BOMInterfaceV2 from './../containers/BOMInterfaceV2';

function BOMMain(props){
    return(
        <BOMInterfaceV2 user={props.user} currency={props.options.currency} 
        store={props.options.store} changeLock={props.changeLock}/>
    );
}

export default BOMMain;