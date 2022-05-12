import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';

import {
    useTableBOM, useApiAttributes, 
    useQuantityMultiplier, evalLineApis
} from './../hooks/BOMTable';
import {useApiData, useApiDataProgress} from './../hooks/BOMData';
import {useBOMEvaluation} from './../hooks/BOMEvaluation';
import {BOMAPITableV2} from './BOMAPITable';
import {NumberInput, OutsideControlCheckbox, 
    LabeledCheckbox,
    SelectSingleRadioButtons} from './Forms';
import { NamedCheckBox } from './Checkbox';
import BOMExporter from './BOMExporter';
import BOMExporterV2 from './BOMExporterV2';
import {BOMApiProgressBarV2} from './Progress';

import {downloadFile} from './../scripts/General';

import './../css/temp.css';
import './../css/bomtool.css';

const buildtype = process.env.NODE_ENV;

function BOMToolV3(props){
    const apisList = useMemo(() => props.apis.map((api => api.accessor)));
    const mpnList = useMemo(() => props.bom.reduce((arr, line) => {
        line.mpnOptions.forEach(mpn => arr.push(mpn));
        return arr;
    }, []), [props.bom]);
    const [requestApis, setRequestApis] = useState(0);
    const [updateTableCall, setUpdateTableCall] = useState(0);
    const [callApiRetry] = useApiData(requestApis, mpnList, apisList, props.updateApiDataMap, 
        props.store, props.currency, props.changeLock, props.apiData);
    const apiDataProgress = useApiDataProgress(mpnList, props.apiData, 
        props.store, props.currency, props.changeLock);
    const [tableBOM, setTable, tableColumns, 
        runBOMAlgorithms, runBOMLineAlgorithms, resortOffers, 
        linesComplete, retryLine, waitingRowApi] = useTableBOM(requestApis, 
        props.bom, props.tableHeaders, 
        props.apis, props.apiData, apiDataProgress, 
        updateTableCall, props.store, props.currency
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
    }
    function changeActiveApisGlobal(apis){
        const newTable = [...tableBOM].map((line) => {
            if(!line.lineLock){
                line.activeApis = line.activeApis.map((actApi) => {
                    actApi.active = apis[actApi.accessor];
                    return actApi;
                });
            }
            return line;
        });
        runBOMAlgorithms(newTable);
    }
    function retryApi(mpn, api, rowNum){
        function onComplete(newData){
            retryLine(rowNum, api, newData);
        }
        waitingRowApi(rowNum, api);
        callApiRetry(mpn, api, onComplete);
    }
    const functions = {
        mpns: {
            click: () => console.log('click')
        },
        quantities: {
            adjustQuantity: adjustQuantity
        },
        activeApis: {
            submitNewApis: changeActiveApis,
            submitGlobalApis: changeActiveApisGlobal
        },
        api: {
            retry: retryApi
        }
    }
    const highlightOptions = [
        {label: 'Lowest Price', id: 'price'}, 
        {label: 'Lead Time', id: 'lead_time'}
    ];
    const [highlightMode, setHighlightMode] = useState(highlightOptions[0].id);
    function handleChangeHighlight(hlMode){
        setHighlightMode(hlMode);
        //const sortedTable = resortOffers(hlMode);
        //setTable(sortedTable);
    }
    function handleTest(){
        runBOMAlgorithms(tableBOM);
    }
    function exportTableJson(){
        downloadFile('tablejson', JSON.stringify(tableBOM));
    }
    function handleLineLock(bool, lineNum){
        const newTable = update(tableBOM, {
            [lineNum]: {lineLock: 
                {$set: bool}
            }
        });
        setTable(newTable);
    }
    function handleLineLockAll(bool){
        const newTable = [...tableBOM].map((line) => {
            line.lineLock = bool;
            return line;
        });
        setTable(newTable);
    }
    const [bomEvaluation] = useBOMEvaluation(tableBOM, apiDataProgress.finished);
    const [showProgress, setShowProgress] = useState(true);
    function handleHideBar(){
        setShowProgress(false);
    }
    //console.log(linesComplete);
    return(
        <>
        <div className='FlexNormal'>
            <div className='Hori'>
            <NumberInput label={'Multi'} value={quantityMultiplier} onBlur={handleMultiBlur} 
            disabled={!apiDataProgress.finished}/>
            {<BOMExporterV2 data={tableBOM} apis={props.apis} bomAttrs={tableColumns} 
            apiAttrs={apiAttrs}/>}
            <HighlightOptions disabled={!apiDataProgress.finished} onChange={handleChangeHighlight} options={highlightOptions}/>
            <BOMEval evaluation={bomEvaluation}/>
            { buildtype !== 'production' &&
            <div>
            <Button onClick={handleRequestApis}>Call APIs</Button>
            <Button onClick={handleTest}>Test</Button>
            <Button onClick={exportTableJson}>Export JSON</Button>
            </div>
            }
            </div>
        </div>
        <BOMApiProgressBarV2 show={showProgress} numParts={tableBOM.length}
        onHideBar={handleHideBar} numFinished={linesComplete}/>
        <BOMAPITableV2 data={tableBOM} bomAttrs={tableColumns} 
        apis={props.apis} apiAttrs={apiAttrs} functions={functions}
        highlightMode={highlightMode} 
        hasLineLocks onLineLockAll={handleLineLockAll} onLineLock={handleLineLock}/>
        </>
    );
}

function BOMEval(props){
    return(
        <div>
            <div>BOM Evaluation</div>
                <div>Number Of Lines: {props.evaluation.numLines}</div>
                <div className='Hori'>
                    <div>
                        <div>Best Price</div>
                        <div>Quoted: {props.evaluation.bestprice.quotedPercent.toFixed(2)}%</div>
                        <div>Unquoted: {props.evaluation.bestprice.unquotedPercent.toFixed(2)}%</div>
                        <div>Total Price: {props.evaluation.bestprice.total_price.toFixed(2)}</div>
                    </div>
                    <div>
                        <div>Lead Time</div>
                        <div>Quoted: {props.evaluation.leadtime.quotedPercent.toFixed(2)}%</div>
                        <div>Unquoted: {props.evaluation.leadtime.unquotedPercent.toFixed(2)}%</div>
                        <div>Total Price: {props.evaluation.leadtime.total_price.toFixed(2)}</div>
                    </div>
                </div>
        </div>
    );
}

function HighlightOptions(props){
    const [stockOnly, setStockOnly] = useState(false);
    function handleChange(newOption){
        props.onChange(newOption);
    }
    function handleChangeStockOnly(so){
        setStockOnly(so);
    }
    return(
        <div>
        <LabeledCheckbox label={'In Stock Only'} 
        checked={stockOnly} onChange={handleChangeStockOnly}/>
        <SelectSingleRadioButtons options={props.options}
        onChange={handleChange} disabled={props.disabled}/>
        </div>
    )
}

export default BOMToolV3;