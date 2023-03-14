import {useState, useEffect} from 'react';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import '../../css/main.css';

function QuotingTables(props){
    const [tableState, setTableState] = useState(0);
    function renderTable(){
        switch(tableState){
            case 0:
                return <Manufacturer/>
        }
        ///return 
    }

    return(
        <>{renderTable()}</>
    );
}

function Manufacturer(props){
    return(
        <>Manu</>
    );
}

export default QuotingTables;