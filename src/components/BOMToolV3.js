import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';

import {useTableBOM} from './../hooks/BOMTable';
import {useApiData} from './../hooks/BOMData';

function BOMToolV3(props){
    //console.log(props.apiData);
    const apisList = useMemo(() => props.apis.map((api => api.accessor)));
    const mpnList = useMemo(() => props.bom.reduce((arr, line) => {
        line.mpnOptions.forEach(mpn => arr.push(mpn));
        return arr;
    }, []), [props.bom]);
    const [requestApis, setRequestApis] = useState(0);
    const apiData = useApiData(requestApis, mpnList, apisList, props.updateApiDataMap);
    const [tableBOM, setTableBOM, tableColumns] 
    = useTableBOM(requestApis, props.bom, props.tableHeaders, 
        props.apis, props.apiData);
    function handleRequestApis(){
        setRequestApis(requestApis+1);
    }
    console.log(tableBOM);
    //console.log(tableColumns);
    return(
        <div>
            <Button onClick={handleRequestApis}>Call APIs</Button>
            Hi
        </div>
    );
}

export default BOMToolV3;