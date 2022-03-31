import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';

import {useTableBOM, useApiAttributes} from './../hooks/BOMTable';
import {useApiData} from './../hooks/BOMData';
import {BOMAPITableV2} from './BOMAPITable';

function BOMToolV3(props){
    //console.log(props.apiData);
    const apisList = useMemo(() => props.apis.map((api => api.accessor)));
    const mpnList = useMemo(() => props.bom.reduce((arr, line) => {
        line.mpnOptions.forEach(mpn => arr.push(mpn));
        return arr;
    }, []), [props.bom]);
    const [requestApis, setRequestApis] = useState(0);
    const apiData = useApiData(requestApis, mpnList, apisList, props.updateApiDataMap);
    const [tableBOM, setTableBOM, tableColumns] = useTableBOM(requestApis, 
        props.bom, props.tableHeaders, 
        props.apis, props.apiData
    );
    const apiAttrs = useApiAttributes();
    function handleRequestApis(){
        setRequestApis(requestApis+1);
    }
    console.log(tableBOM);
    return(
        <div>
            <Button onClick={handleRequestApis}>Call APIs</Button>
            <BOMAPITableV2 data={tableBOM} bomAttrs={tableColumns} 
            apis={props.apis} apiAttrs={apiAttrs}/>
        </div>
    );
}

export default BOMToolV3;