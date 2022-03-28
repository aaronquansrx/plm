import React, {useEffect, useState} from 'react';

import BOMInterface from './../containers/BOMInterface';
import BOMInterfaceV2 from './../containers/BOMInterfaceV2';

function BOMMain(props){
    return(
        <BOMInterfaceV2 login={props.login}/>
    );
}

export default BOMMain;