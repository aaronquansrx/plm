import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import axios from 'axios';

import Button from 'react-bootstrap/Button';

import {
    useTableBOM, useApiAttributes, 
    useQuantityMultiplier, useApiRetrys,
    useMpnOptions
} from './../hooks/BOMTable';
import {useApiData, useApiDataProgress} from './../hooks/BOMData';
import {useBOMEvaluation} from './../hooks/BOMEvaluation';
import {useSaveBom} from './../hooks/BOMToolButtons';

import {BOMAPITableV2} from './BOMAPITable';

import {NumberInput, OutsideControlCheckbox, 
    LabeledCheckbox,
    SelectSingleRadioButtons, ToggleSwitch} from './Forms';
import { NamedCheckBox } from './Checkbox';
import BOMExporter from './BOMExporter';
import BOMExporterV2 from './BOMExporterV2';
import {SaveBom} from './Modals';
import {BOMApiProgressBarV2} from './Progress';
import {HoverOverlay} from './Tooltips';

import {downloadFile} from './../scripts/General';

import './../css/temp.css';
import './../css/bomtool.css';

import { useServerUrl } from '../hooks/Urls';

const buildtype = process.env.NODE_ENV;

function BOMToolV3(props){
    //console.log(props.tableHeaders);
    //console.log(props.bom);
    const serverUrl = useServerUrl();
    const waitingOffer = {
        offers: [],
        offerOrder: {
            stock: {price: [], leadTime: []},
            noStock: {price: [], leadTime: []}
        },
        message: 'Waiting...',
        retry: false
    };
    const apisList = useMemo(() => props.apis.map((api => api.accessor)));
    const mpnList = useMemo(() => props.bom.reduce((arr, line) => {
        line.mpnOptions.forEach(mpn => arr.push(mpn));
        return arr;
    }, []), [props.bom]);
    const isLoadedBom = props.bomType === 'saved' || props.bomType === 'saved_nodata';
    const [updateTableCall, setUpdateTableCall] = useState(0);
    const [callApiRetry, callMpn, callApisRetry] = useApiData(mpnList, apisList, props.updateApiDataMap, 
         props.store, props.currency, props.changeLock, props.apiData, props.bomType, props.loadData);
    const [showProgress, handleHideBar, numMpns, mpnsInProgress, retryMpns,
        dataProcessingLock, retryAllStart, setDataProcessingLock, setMpnsInProgress] = useApiDataProgress(mpnList, props.apiData, 
        props.store, props.currency, props.changeLock);
    const [leadtimeCutOff, setLeadtimeCutOff] = useState('');
    function handleLeadtimeCutOff(newLTC){
        if(newLTC === ''){
            setLeadtimeCutOff('');
        }else{
            setLeadtimeCutOff(newLTC);
        }
        runBOMAlgorithms(tableBOM, newLTC);
    }
    const [tableBOM, setTable, tableColumns, 
        runBOMAlgorithms, runBOMLineAlgorithms, retryLine, waitingRowApi,
        changeMPNLine, evalMpn, tableLock] = useTableBOM(
        props.bom, props.tableHeaders, 
        props.apis, props.apiData, 
        updateTableCall, leadtimeCutOff, props.store, props.currency, dataProcessingLock
    );
    const apiAttrs = useApiAttributes();
    const [quantityMultiplier, adjustQuantity, handleMultiBlur] = useQuantityMultiplier(tableBOM, props.apiData, 
        apisList, runBOMAlgorithms, runBOMLineAlgorithms);
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
    const [retryApi, retryAll] = useApiRetrys(props.apiData, apisList, mpnList, 
        retryLine, waitingRowApi, callApiRetry, setDataProcessingLock,
        retryAllStart, callApisRetry, setMpnsInProgress);
    function changeMPNOption(row, newMPN){
        //console.log(row+' '+newMPN);
        const newLine = {...tableBOM[row]};
        changeMPNLine(row, newLine, newMPN);
    }
    const [addMpnOption, editMpnOption] = useMpnOptions();
    function addMPNOption(row){
        const newLine = {...tableBOM[row]};
        newLine.mpns.current = '';
        newLine.mpns.options.push('');
        apisList.forEach((api) => {
            newLine[api] = waitingOffer;
        });
        newLine.maxOffers = 1;
        const newTable = update(tableBOM, {
            [row]: {
                $set: newLine
            }
        });
        setTable(newTable);
    }
    function editMPNOption(row, oldMpn, newMpn){
        const newLine = {...tableBOM[row]};
        const i = newLine.mpns.options.indexOf(oldMpn);
        newLine.mpns.options[i] = newMpn;
        newLine.mpns.current = newMpn;
        function onComp(data){
            const ea = evalMpn(newLine, data);
            console.log(ea);
            Object.assign(newLine, ea);
            newLine.maxOffers = data.maxOffers;
            const newBOM = update(tableBOM, {
                [row]: {$set: newLine}
            });
            runBOMLineAlgorithms(row, newBOM);
        }
        if(props.apiData.has(newMpn)){
            onComp(props.apiData.get(newMpn).data);
        }else{
            apisList.forEach((api) => {
                newLine[api] = waitingOffer;
            });
            const newBOM = update(tableBOM, {
                [row]: {$set: newLine}
            });
            setTable(newBOM);
            callMpn(newMpn, onComp);
        }
    }
    function deleteMPNOption(row, delMpn){
        const newLine = {...tableBOM[row]};
        const i = newLine.mpns.options.indexOf(delMpn);
        const newMpn = i === 0 ? newLine.mpns.options[1] : newLine.mpns.options[i-1];
        newLine.mpns.options.splice(i, 1)
        changeMPNLine(row, newLine, newMpn);
    }
    const functions = {
        mpns: {
            changeOption: changeMPNOption,
            addOption: addMPNOption,
            editOption: editMPNOption,
            deleteOption: deleteMPNOption
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
        {label: 'Best Price', id: 'price'}, 
        {label: 'Best Lead Time', id: 'leadTime'}
    ];
    const [highlightMode, setHighlightMode] = useState({best: highlightOptions[0].id, stock: false});
    function handleChangeHighlight(hlMode){
        setHighlightMode(update(highlightMode, {
            best: {$set: hlMode}
        }));
    }
    function handleChangeStock(inStock){
        setHighlightMode(update(highlightMode, {
            stock: {$set: inStock}
        }))
    }
    function handleTest(){
        console.log(props.apiData);
        ///runBOMAlgorithms(tableBOM);
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
    const [bomEvaluation] = useBOMEvaluation(tableBOM, tableLock);
    
    const [tableState, setTableState] = useState('APIs');
    function handleTableSwitch(state){
        //console.log(state);
        const tbs = state ? 'APIs' : 'Best';
        setTableState(tbs);
    }
    const [showSaveModal, toggleSavedBomModal, saveBom] = useSaveBom(tableBOM, props.apiData, apisList, mpnList, 
        props.user, props.currency, props.store, props.loadData.bom_id);
    return(
        <>
        <div className='FlexNormal'>
            <div className='Hori'>
            <div>
            <NumberInput label={'Multi'} value={quantityMultiplier} onBlur={handleMultiBlur} 
            disabled={tableLock}/>
            <NumberInput label={'Leadtime Cut Off'} value={leadtimeCutOff} onBlur={handleLeadtimeCutOff} 
            disabled={tableLock}/>
            </div>
            {<BOMExporterV2 data={tableBOM} apis={props.apis} bomAttrs={tableColumns} 
            apiAttrs={apiAttrs} evaluation={bomEvaluation} algorithm={highlightMode}/>}
            <HighlightOptions disabled={tableLock} onChangeHighlight={handleChangeHighlight}
            onChangeStock={handleChangeStock}
            options={highlightOptions}/>
            <BOMEval evaluation={bomEvaluation}/>
            <div>
            <LabeledCheckbox label={'Show All APIs'} 
            checked={tableState === 'APIs'} onChange={handleTableSwitch} disabled={false}/>
            {/*<HoverOverlay tooltip={props.user ? 'Save BOM' : 'Requires Login'}>
            <Button onClick={toggleSavedBomModal} disabled={!props.user}>Save BOM</Button>
            </HoverOverlay>*/}
            <Button onClick={retryAll} disabled={tableLock || retryMpns.size === 0}>Retry {retryMpns.size} MPN(s)</Button>
            </div>
            { buildtype !== 'production' &&
            <div>
            <Button onClick={handleTest}>Test</Button>
            <Button onClick={exportTableJson}>Export JSON</Button>
            <HoverOverlay tooltip={props.user ? 'Save BOM' : 'Requires Login'} placement='auto'>
            <Button onClick={toggleSavedBomModal} disabled={!props.user}>Save BOM</Button>
            </HoverOverlay>
            </div>
            }
            </div>
        </div>
        <SaveBom show={showSaveModal} save={saveBom} showOverwrite={isLoadedBom} hideAction={toggleSavedBomModal}/>
        <BOMApiProgressBarV2 show={showProgress} numParts={numMpns}
        onHideBar={handleHideBar} numFinished={numMpns-mpnsInProgress.size}/>
        <BOMAPITableV2 data={tableBOM} bomAttrs={tableColumns} 
        apis={props.apis} apiAttrs={apiAttrs} functions={functions}
        highlightMode={highlightMode}  functionLock={tableLock}
        hasLineLocks onLineLockAll={handleLineLockAll} onLineLock={handleLineLock}
        tableState={tableState}/>
        </>
    );
}

function BOMEval(props){
    return(
        <div>
            <div>BOM Evaluation</div>
            <div>Number Of Lines: {props.evaluation.numLines}</div>
            <div className='Hori'>
                <div className='SmallPadding'>
                    <div>Best Price</div>
                    <div>Quoted: {props.evaluation.price.quotedPercent.toFixed(2)}%</div>
                    <div>Unquoted: {props.evaluation.price.unquotedPercent.toFixed(2)}%</div>
                    <div>Total Price: {props.evaluation.price.total_price.toFixed(2)}</div>
                </div>
                <div className='SmallPadding'>
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
        props.onChangeHighlight(newOption);
    }
    function handleChangeStockOnly(so){
        setStockOnly(so);
        props.onChangeStock(so);
    }
    return(
        <div>
        <LabeledCheckbox label={'In Stock Only'} 
        checked={stockOnly} onChange={handleChangeStockOnly} disabled={props.disabled}/>
        <SelectSingleRadioButtons options={props.options}
        onChange={handleChange} disabled={props.disabled}/>
        </div>
    )
}

export default BOMToolV3;