import React, {useEffect, useState} from 'react';

import BOMInterface from './../containers/BOMInterface';
import BOMInterfaceV2 from './../containers/BOMInterfaceV2';

function BOMMain(props){
    return(
        <BOMInterfaceV2 login={props.login} currency={props.options.currency} 
        store={props.options.store}/>
    );
}

export default BOMMain;