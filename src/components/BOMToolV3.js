import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';

import {
    useTableBOM, useApiAttributes, 
    useQuantityMultiplier, evalLineApis
} from './../hooks/BOMTable';
import {useApiData, useApiDataProgress} from './../hooks/BOMData';
import {BOMAPITableV2} from './BOMAPITable';
import {NumberInput, SelectSingleRadioButtons} from './Forms';
import { NamedCheckBox } from './Checkbox';
import BOMExporter from './BOMExporter';

import './../css/temp.css';

function BOMToolV3(props){
    //console.log(props.apiData);
    const apisList = useMemo(() => props.apis.map((api => api.accessor)));
    const mpnList = useMemo(() => props.bom.reduce((arr, line) => {
        line.mpnOptions.forEach(mpn => arr.push(mpn));
        return arr;
    }, []), [props.bom]);
    const [requestApis, setRequestApis] = useState(0);
    const [updateTableCall, setUpdateTableCall] = useState(0);
    useApiData(requestApis, mpnList, apisList, props.updateApiDataMap, 
        props.store, props.currency, props.changeLock);
    const apiDataProgress = useApiDataProgress(mpnList, props.apiData, 
        props.store, props.currency, props.changeLock);
    const [tableBOM, setTable, tableColumns, runBOMAlgorithms, runBOMLineAlgorithms] = useTableBOM(requestApis, 
        props.bom, props.tableHeaders, 
        props.apis, props.apiData, apiDataProgress, 
        updateTableCall
    );
    const apiAttrs = useApiAttributes();
    function handleRequestApis(){
        setRequestApis(requestApis+1);
    }
    const [quantityMultiplier, adjustQuantity, handleMultiBlur] = useQuantityMultiplier(tableBOM, props.apiData, 
        apisList, runBOMAlgorithms, runBOMLineAlgorithms, apiDataProgress);
    function changeActiveApis(apis, row){
        const newActiveApis = [...tableBOM[row].activeApis].map((actApi) => {
            actApi.active = apis[actApi.accessor];
            return actApi;
        });
        const newTable = update(tableBOM, {
            [row]: {
                activeApis: {$set: newActiveApis}
            }
        });
        runBOMLineAlgorithms(row, newTable);
        //setTable(newTable);
        //updateTable(newTable);
    }
    const functions = {
        mpns: {
            click: () => console.log('click')
        },
        quantities: {
            adjustQuantity: adjustQuantity
        },
        activeApis: {
            submitNewApis: changeActiveApis
        }
    }
    const highlightOptions = [
        {label: 'Lowest Price', id: 'price'}, 
        {label: 'Lead Time', id: 'lead_time'}
    ];
    const [highlightMode, setHighlightMode] = useState(highlightOptions[0].id);
    function handleChangeHighlight(hlMode){
        setHighlightMode(hlMode);
    }
    /*
    function updateTable(table=null){
        if(table !== null) setTable(table);
        setUpdateTableCall(updateTableCall+1);
    }*/
    function handleTest(){
        runBOMAlgorithms(tableBOM);
        //console.log(tableBOM);
    }

    return(
        <>
        <div className='FlexNormal'>
            <div className='Hori'>
            <Button onClick={handleRequestApis}>Call APIs</Button>
            <NumberInput label={'Multi'} value={quantityMultiplier} onBlur={handleMultiBlur} 
            disabled={!apiDataProgress.finished}/>
            {<BOMExporter data={tableBOM} apis={props.apis} bomAttrs={tableColumns} 
            apiAttrs={apiAttrs}/>}
            <HighlightOptions onChange={handleChangeHighlight} options={highlightOptions}/>
            <Button onClick={handleTest}>Test</Button>
            </div>
        </div>
        <BOMAPITableV2 data={tableBOM} bomAttrs={tableColumns} 
        apis={props.apis} apiAttrs={apiAttrs} functions={functions}
        highlightMode={highlightMode}/>
        </>
    );
}

function HighlightOptions(props){
    function handleChange(newOption){
        props.onChange(newOption);
    }
    return(
        <div>
        <SelectSingleRadioButtons options={props.options}
        onChange={handleChange}/>
        </div>
    )
}

export default BOMToolV3;