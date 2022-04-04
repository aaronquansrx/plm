import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';

import {
    useTableBOM, useApiAttributes, 
    useQuantityMultiplier, evalLineApis
} from './../hooks/BOMTable';
import {useApiData, useApiDataProgress} from './../hooks/BOMData';
import {BOMAPITableV2} from './BOMAPITable';
import {NumberInput} from './Forms';
import BOMExporter from './BOMExporter';

function BOMToolV3(props){
    //console.log(props.apiData);
    const apisList = useMemo(() => props.apis.map((api => api.accessor)));
    const mpnList = useMemo(() => props.bom.reduce((arr, line) => {
        line.mpnOptions.forEach(mpn => arr.push(mpn));
        return arr;
    }, []), [props.bom]);
    const [requestApis, setRequestApis] = useState(0);
    const apiData = useApiData(requestApis, mpnList, apisList, props.updateApiDataMap);
    const [tableBOM, setTable, tableColumns] = useTableBOM(requestApis, 
        props.bom, props.tableHeaders, 
        apisList, props.apiData
    );
    const apiDataProgress = useApiDataProgress(mpnList, props.apiData);
    const apiAttrs = useApiAttributes();
    function handleRequestApis(){
        setRequestApis(requestApis+1);
    }
    function newLineChangeQuantity(line, single, multi){
        const newLine = {...line};
        newLine.quantities.single = single
        newLine.quantities.multi = multi;
        const mpnApiData = props.apiData.get(line.mpns.current).data;
        const lineApiData = evalLineApis(newLine, apisList, mpnApiData);
        lineApiData.forEach((lad) => {
            newLine[lad.api].offers = lad.offers;
        });
        return newLine;
    }
    function adjustQuantity(newQuantity, row){
        if(newQuantity !== tableBOM[row].quantities.single){
            if(!apiDataProgress.mpnsNotEvaluated.has(tableBOM[row].mpns.current)){
                const newLine = newLineChangeQuantity(tableBOM[row], newQuantity, 
                    newQuantity*quantityMultiplier);
                setTable(update(tableBOM, {
                    [row]: {$set: newLine}
                }));
            }
        }
    }
    const [quantityMultiplier, setQuantityMultiplier] = useState(1);
    function handleMultiBlur(newMulti){
        if(apiDataProgress.finished){
            if(quantityMultiplier !== newMulti){
                const newTable = [...tableBOM].map((line) => {
                    const newLine = newLineChangeQuantity(line, line.quantities.initial,
                        line.quantities.initial*newMulti);
                    return newLine;
                });
                setTable(newTable);
                setQuantityMultiplier(newMulti);
            }
        }
    }
    const functions = {
        mpns: {
            click: () => console.log('click')
        },
        quantities: {
            adjustQuantity: adjustQuantity
        }
    }
    return(
        <>
        <div className='FlexNormal'>
            <Button onClick={handleRequestApis}>Call APIs</Button>
            <NumberInput label={'Multi'} value={quantityMultiplier} onBlur={handleMultiBlur} 
            disabled={!apiDataProgress.finished}/>
            {/*<BOMExporter data={tableBOM} apis={props.apis} bomAttrs={tableColumns}/>*/}
        </div>
        <BOMAPITableV2 data={tableBOM} bomAttrs={tableColumns} 
        apis={props.apis} apiAttrs={apiAttrs} functions={functions}/>
        </>
    );
}

export default BOMToolV3;