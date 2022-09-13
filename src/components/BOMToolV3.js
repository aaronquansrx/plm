import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import axios from 'axios';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import {
    useTableBOM, useApiAttributes, 
    useQuantityMultiplier, useApiRetrys,
    useMpnOptions, useQuantityMultiplierV2
} from './../hooks/BOMTable';
import {useApiData, useApiDataProgress} from './../hooks/BOMData';
import {useBOMEvaluation, useBOMEvaluationV2} from './../hooks/BOMEvaluation';
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

import { stockString } from '../scripts/AlgorithmVariable';
import { findPriceBracket } from '../scripts/Offer';

import {downloadFile} from './../scripts/General';

import './../css/temp.css';
import './../css/bomtool.css';

import { useServerUrl } from '../hooks/Urls';

const buildtype = process.env.NODE_ENV;

function BOMToolV3(props){
    //console.log(props.tableHeaders);
    //console.log(props.bom);
    const serverUrl = useServerUrl();
    const [searchTerm, setSearchTerm] = useState('');
    const [displayApis, setDisplayApis] = useState(props.apis);
    const allApisList = useMemo(() => props.apis.map((api => api.accessor)));
    const mpnList = useMemo(() => props.bom.reduce((arr, line) => {
        line.mpnOptions.forEach(mpn => arr.push(mpn));
        return arr;
    }, []), [props.bom]);
    const mpnListWithQuantity = useMemo(() => props.bom.reduce((arr, line) => {
        //console.log(line);
        line.mpnOptions.forEach(mpn => arr.push({mpn: mpn, quantity: line.quantity}));
        return arr;
    }, []), [props.bom])
    const isLoadedBom = props.bomType === 'saved' || props.bomType === 'saved_nodata';
    const [updateTableCall, setUpdateTableCall] = useState(0);

    const highlightOptions = [
        {label: 'Price', id: 'price'}, 
        {label: 'Lead Time', id: 'leadtime'}
    ];
    const [algorithmMode, setAlgorithmMode] = useState({best: highlightOptions[0].id, stock: false});
    const [quantityMultiplier, handleChangeMulti] = useQuantityMultiplierV2();
    const [callApiRetry, callMpn, callApisRetry, multiRetryData] = useApiData(mpnList, mpnListWithQuantity, allApisList, props.updateApiDataMap, 
        props.store, props.currency, props.apiData, props.bomType, props.loadData, props.changeLock);
    const [showProgress, handleHideBar, numMpns, mpnsInProgress, retryMpns,
        dataProcessingLock, retryAll, setDataProcessingLock, 
        setMpnsInProgress, retryLock] = useApiDataProgress(mpnList, allApisList, props.apiData, 
            callApisRetry, props.store, props.currency);
    const [leadtimeCutOff, setLeadtimeCutOff] = useState('');
    function handleLeadtimeCutOff(newLTC){
        if(newLTC === ''){
            setLeadtimeCutOff('');
        }else{
            setLeadtimeCutOff(newLTC);
        }
        runBOMAlgorithms(tableBOM, newLTC);
    }
    const [bomEvaluation, changeEvaluation, adjustLineEvaluation] = useBOMEvaluationV2(props.bom);
    const [tableBOM, filteredTableBOM, setTable, tableColumns, 
        runBOMAlgorithms, runBOMLineAlgorithms, retryForApis, waitingRowApi,
        changeMPNLine, changeQuantityLine, changeActiveApis, changeTableActiveApisGlobal, evalMpn, tableLock] = useTableBOM(
        props.bom, props.tableHeaders, 
        props.apis, props.apiData, 
        updateTableCall, leadtimeCutOff, props.store, props.currency, dataProcessingLock, props.changeLock,
        searchTerm, changeEvaluation, algorithmMode, quantityMultiplier, retryLock, retryMpns, multiRetryData
    );
    //const apiAttrs = useApiAttributes();
    const apiAttrs = props.apiAttrs;
    //const [quantityMultiplier, adjustQuantity, handleMultiBlur] = useQuantityMultiplier(tableBOM, props.apiData, 
    //    allApisList, runBOMAlgorithms, runBOMLineAlgorithms);
    /*
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
        //console.log(newActiveApis);
        setTable(newTable);
        runBOMAlgorithms(newTable);
    }*/
    
    function changeActiveApisGlobal(apis){
        const filteredApis = props.apis.reduce((arr, ap) => {
            if(apis[ap.accessor]) arr.push(ap);
            return arr;
        }, []);
        setDisplayApis(filteredApis);
        changeTableActiveApisGlobal(apis);
    }
    
    const [retryApi/*, retryAll*/] = useApiRetrys(props.apiData, allApisList, mpnList, 
        retryForApis, waitingRowApi, callApiRetry, setDataProcessingLock,
        retryAll, callApisRetry, setMpnsInProgress, retryMpns);
    const [addMpnOption, editMpnOption, deleteMpnOption, changeMpnOption] = useMpnOptions(tableBOM, props.apiData,
        allApisList, setTable, runBOMLineAlgorithms, callMpn, changeMPNLine);
    function requestOctopart(row, callback){
        //console.log('octopart');
        //console.log(row);
        const mpn = tableBOM[row].mpns.current;
        const quantity = tableBOM[row].quantities.multi;
        axios({
            method: 'GET',
            url: serverUrl+'api/octopart',
            params: {search: mpn, quantity: quantity, currency: props.currency, store: props.store},
            //signal: controller.signal
        }).then(response => {
            console.log(response.data);
            const octoData = response.data;
            const findMpnData = octoData.data.find((octo) => octo.mpn === mpn);
            if(findMpnData !== undefined){
                const dists = findMpnData.data.map((d) => {
                    const offers = d.offers.reduce((arr, offer) => {
                        if(Object.keys(offer.pricing).length > 0){
                            if(props.currency in offer.pricing){
                                const pricing = offer.pricing[props.currency].map((pr) => {
                                    return pr;
                                });
                                //const {price, index} = findPriceBracket(pricing, 
                                //    quantity, offer.quantities.MinimumOrder);
                                const obj = {
                                    available: offer.available,
                                    moq: offer.moq,
                                    leadtime: offer.leadtime,
                                    spq: offer.spq,
                                    //pricing: pricing,
                                    prices: {
                                        price: offer.price,
                                        pricing: pricing,
                                        pricingIndex: offer.price_index,
                                    },
                                    packaging: offer.packaging
                                }
                                arr.push(obj);
                            }else{
                                console.log(offer.pricing);
                            }
                        }
                        return arr;
                    }, []);
                    return {
                        distributor: d.company,
                        offers: offers
                    };
                });
                console.log(dists);
                callback(dists);
            }
            //console.log(response.data);
            //callback(mpn, response.data, props.currency);
        });
        
    }
    function adjustQuantity(newQuantity, row){
        console.log(newQuantity+' '+row);
        changeQuantityLine(row, newQuantity);
    }
    const functions = {
        mpns: {
            changeOption: changeMpnOption,
            addOption: addMpnOption,
            editOption: editMpnOption,
            deleteOption: deleteMpnOption,
        },
        quantities: {
            adjustQuantity: adjustQuantity
        },
        activeApis: {
            submitNewApis: changeActiveApis,
            submitGlobalApis: changeActiveApisGlobal,
        },
        octopart: {
            requestOctopart: requestOctopart
        },
        api: {
            retry: retryApi
        },
        offer: {
            selectOffer: selectOffer
        }
    }
    function selectOffer(row, api, offerNum){
        const newTable = update(tableBOM, {
            [row]: {[api]: {offers: {[offerNum]: {selected: {$set: !tableBOM[row][api].offers[offerNum].selected}}}}}
        });
        setTable(newTable);
    }
    function handleChangeHighlight(hlMode){
        setAlgorithmMode(update(algorithmMode, {
            best: {$set: hlMode}
        }));
    }
    function handleChangeStock(inStock){
        setAlgorithmMode(update(algorithmMode, {
            stock: {$set: inStock}
        }))
    }
    function handleTest(){
        runBOMAlgorithms();
        //console.log(props.apiData);
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
    //const [bomEvaluation] = useBOMEvaluation(tableBOM, tableLock);
    
    const [tableState, setTableState] = useState('APIs');
    function handleTableSwitch(state){
        const tbs = state ? 'APIs' : 'Best';
        setTableState(tbs);
    }
    function searchMpns(searchTerm){
        setSearchTerm(searchTerm);
    }
    const [showSaveModal, toggleSavedBomModal, saveBom] = useSaveBom(tableBOM, props.apiData, allApisList, mpnList, 
        props.user, props.currency, props.store, props.loadData.bom_id);
    return(
        <>
        <div className='FlexNormal'>
            <div className='Hori'>
            <div>
            <NumberInput label={'Multi'} value={quantityMultiplier} onBlur={handleChangeMulti} 
            disabled={tableLock}/>
            <NumberInput label={'Leadtime Cut Off'} value={leadtimeCutOff} onBlur={handleLeadtimeCutOff} 
            disabled={tableLock}/>
            <Search search={searchMpns} on/>
            </div>
            {<BOMExporterV2 data={tableBOM} apis={props.apis} bomAttrs={tableColumns} 
            apiAttrs={apiAttrs} evaluation={bomEvaluation} algorithm={algorithmMode}/>}
            <HighlightOptions disabled={tableLock} onChangeHighlight={handleChangeHighlight}
            onChangeStock={handleChangeStock}
            options={highlightOptions}/>
            <BOMEval evaluation={bomEvaluation} algorithmMode={algorithmMode}/>
            <div>
            <LabeledCheckbox label={'Show All APIs'} id={'showallapis'} className='Pointer'
            checked={tableState === 'APIs'} onChange={handleTableSwitch} disabled={false}/>
            {/*<HoverOverlay tooltip={props.user ? 'Save BOM' : 'Requires Login'}>
            <Button onClick={toggleSavedBomModal} disabled={!props.user}>Save BOM</Button>
            </HoverOverlay>*/}
            <Button onClick={retryAll} disabled={tableLock || retryMpns.length === 0}>Retry {retryMpns.length} MPN(s)</Button>
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
        <BOMAPITableV2 data={filteredTableBOM} bomAttrs={tableColumns} 
        apis={displayApis} allApis={props.apis} apiAttrs={apiAttrs} functions={functions}
        algorithmMode={algorithmMode}  functionLock={tableLock}
        hasLineLocks onLineLockAll={handleLineLockAll} onLineLock={handleLineLock}
        tableState={tableState}/>
        </>
    );
}

function BOMEval(props){
    const ss = stockString(props.algorithmMode.stock);
    const ev = props.evaluation.evaluation;
    return(
        <div>
            <div>BOM Evaluation</div>
            <div>Number Of Lines: {props.evaluation.numLines}</div>
            <div className='Hori'>
                <div className='SmallPadding'>
                    <div>Quoted: {ev[ss][props.algorithmMode.best].quoted_percent.toFixed(2)}%</div>
                    <div>Unquoted: {ev[ss][props.algorithmMode.best].unquoted_percent.toFixed(2)}%</div>
                    <div>Total Price: {ev[ss][props.algorithmMode.best].total_price.toFixed(2)}</div>
                </div>
                <div className='SmallPadding'>
                    <div>Excess Quantity: {ev[ss][props.algorithmMode.best].total_excess_quantity}</div>
                    <div>Excess Price: {ev[ss][props.algorithmMode.best].total_excess_price.toFixed(2)}</div>
                </div>
                {/*
                <div className='SmallPadding'>
                    <div>Lead Time</div>
                    <div>Quoted: {ev.in_stock.leadtime.quoted_percent.toFixed(2)}%</div>
                    <div>Unquoted: {ev.in_stock.leadtime.unquoted_percent.toFixed(2)}%</div>
                    <div>Total Price: {ev.in_stock.leadtime.total_price.toFixed(2)}</div>
                    <div>Excess Quantity: </div>
                </div>
                */}
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
        <LabeledCheckbox label={'In Stock Only'} id={'instockonly'} className='Pointer'
        checked={stockOnly} onChange={handleChangeStockOnly} disabled={props.disabled}/>
        <SelectSingleRadioButtons options={props.options}
        onChange={handleChange} disabled={props.disabled}/>
        </div>
    )
}

function Search(props){
    const [searchTerm, setSearchTerm] = useState('');
    function handleChangeTerm(e){
        const st = e.target.value;
        setSearchTerm(e.target.value);
        props.search(st);
    }
    return (
        <Form className="d-flex">
            <Form.Control
            type="search" placeholder="Search"
            className="me-2" aria-label="Search"
            //value={searchTerm}
            onChange={handleChangeTerm}
            />
        </Form>
    )
}

export default BOMToolV3;