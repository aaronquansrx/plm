import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import axios from 'axios';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

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
    const waitingOffer = {
        offers: [],
        offerOrder: {
            stock: {price: [], leadTime: []},
            noStock: {price: [], leadTime: []}
        },
        message: 'Waiting...',
        retry: false
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [displayApis, setDisplayApis] = useState(props.apis);
    const allApisList = useMemo(() => props.apis.map((api => api.accessor)));
    const mpnList = useMemo(() => props.bom.reduce((arr, line) => {
        line.mpnOptions.forEach(mpn => arr.push(mpn));
        return arr;
    }, []), [props.bom]);
    const isLoadedBom = props.bomType === 'saved' || props.bomType === 'saved_nodata';
    const [updateTableCall, setUpdateTableCall] = useState(0);
    const [callApiRetry, callMpn, callApisRetry] = useApiData(mpnList, allApisList, props.updateApiDataMap, 
         props.store, props.currency, props.apiData, props.bomType, props.loadData, props.changeLock);
    const [showProgress, handleHideBar, numMpns, mpnsInProgress, retryMpns,
        dataProcessingLock, retryAllStart, setDataProcessingLock, setMpnsInProgress] = useApiDataProgress(mpnList, props.apiData, 
        props.store, props.currency);
    const [leadtimeCutOff, setLeadtimeCutOff] = useState('');
    function handleLeadtimeCutOff(newLTC){
        if(newLTC === ''){
            setLeadtimeCutOff('');
        }else{
            setLeadtimeCutOff(newLTC);
        }
        runBOMAlgorithms(tableBOM, newLTC);
    }
    const [tableBOM, filteredTableBOM, setTable, tableColumns, 
        runBOMAlgorithms, runBOMLineAlgorithms, retryLine, waitingRowApi,
        changeMPNLine, evalMpn, tableLock] = useTableBOM(
        props.bom, props.tableHeaders, 
        props.apis, props.apiData, 
        updateTableCall, leadtimeCutOff, props.store, props.currency, dataProcessingLock, props.changeLock,
        searchTerm
    );
    //const apiAttrs = useApiAttributes();
    const apiAttrs = props.apiAttrs;
    const [quantityMultiplier, adjustQuantity, handleMultiBlur] = useQuantityMultiplier(tableBOM, props.apiData, 
        allApisList, runBOMAlgorithms, runBOMLineAlgorithms);
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
        const filteredApis = props.apis.reduce((arr, ap) => {
            if(apis[ap.accessor]) arr.push(ap);
            return arr;
        }, []);
        setDisplayApis(filteredApis);
        //console.log(props.apis);
        //console.log(filteredApis);
        runBOMAlgorithms(newTable);
    }
    const [retryApi, retryAll] = useApiRetrys(props.apiData, allApisList, mpnList, 
        retryLine, waitingRowApi, callApiRetry, setDataProcessingLock,
        retryAllStart, callApisRetry, setMpnsInProgress);
    function changeMPNOption(row, newMPN){
        //console.log(row+' '+newMPN);
        const newLine = {...tableBOM[row]};
        changeMPNLine(row, newLine, newMPN);
    }
    const [addMpnOption, editMpnOption, deleteMpnOption] = useMpnOptions(tableBOM, props.apiData,
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
                    const offers = d.Offers.reduce((arr, offer) => {
                        if(Object.keys(offer.Pricing).length > 0){
                            if(props.currency in offer.Pricing){
                                const pricing = offer.Pricing[props.currency].map((pr) => {
                                    return pr;
                                });
                                const {price, index} = findPriceBracket(pricing, 
                                    quantity, offer.Quantity.MinimumOrder);
                                const obj = {
                                    available: offer.Quantity.Available,
                                    moq: offer.Quantity.MinimumOrder,
                                    leadtime: offer.LeadTime,
                                    spq: offer.Quantity.OrderMulti,
                                    //pricing: pricing,
                                    prices: {
                                        price: price,
                                        pricing: pricing,
                                        pricingIndex: index,
                                    },
                                    packaging: offer.Packaging
                                }
                                arr.push(obj);
                            }else{
                                console.log(offer.Pricing);
                            }
                        }
                        return arr;
                    }, []);
                    return {
                        distributor: d.Company,
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
    const functions = {
        mpns: {
            changeOption: changeMPNOption,
            addOption: addMpnOption,
            editOption: editMpnOption,
            deleteOption: deleteMpnOption
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
            <NumberInput label={'Multi'} value={quantityMultiplier} onBlur={handleMultiBlur} 
            disabled={tableLock}/>
            <NumberInput label={'Leadtime Cut Off'} value={leadtimeCutOff} onBlur={handleLeadtimeCutOff} 
            disabled={tableLock}/>
            <Search search={searchMpns} on/>
            </div>
            {<BOMExporterV2 data={tableBOM} apis={props.apis} bomAttrs={tableColumns} 
            apiAttrs={apiAttrs} evaluation={bomEvaluation} algorithm={highlightMode}/>}
            <HighlightOptions disabled={tableLock} onChangeHighlight={handleChangeHighlight}
            onChangeStock={handleChangeStock}
            options={highlightOptions}/>
            <BOMEval evaluation={bomEvaluation}/>
            <div>
            <LabeledCheckbox label={'Show All APIs'} id={'showallapis'} className='Pointer'
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
        <BOMAPITableV2 data={filteredTableBOM} bomAttrs={tableColumns} 
        apis={displayApis} allApis={props.apis} apiAttrs={apiAttrs} functions={functions}
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