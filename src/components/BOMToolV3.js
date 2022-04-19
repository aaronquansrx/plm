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
    useApiData(requestApis, mpnList, apisList, props.updateApiDataMap, props.store);
    const apiDataProgress = useApiDataProgress(mpnList, props.apiData);
    const [tableBOM, setTable, tableColumns] = useTableBOM(requestApis, 
        props.bom, props.tableHeaders, 
        props.apis, props.apiData, apiDataProgress, updateTableCall
    );
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
        //setTable(newTable);
        updateTable(newTable);
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
    function updateTable(table=null){
        if(table !== null) setTable(table);
        setUpdateTableCall(updateTableCall+1);
    }
    function handleTest(){
        updateTable();
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

function HighlightBest(props){
    const options = [{display: 'Lowest Price', value: 'lowest'}, {display: 'Lead Time', value: 'lead'}];
    const [optionsSelected, setOptionsSelected] = useState(options.reduce((obj, opt) => {
        obj[opt.value] = false;
        return obj;
    }, {}));
    function handleOptionChange(event){
        const newOptions = update(optionsSelected, {
            [event.target.value]: {$set: !optionsSelected[event.target.value]}
        });
        setOptionsSelected(newOptions);
        props.onChange(newOptions);
    }
    return(
        <div>
            Highlight
            {options.map((opt, i) => 
            <span key={i}>
                <NamedCheckBox disabled={!props.status} onChange={handleOptionChange}
                 value={opt.value} label={opt.display} checked={optionsSelected[opt.value]}/>
            </span>
            )}
        </div>
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