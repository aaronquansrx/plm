import React, {useEffect, useState, useMemo} from 'react';

import update from 'immutability-helper';

import axios from 'axios';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';

import {
    useTableBOM, useApiRetrys,
    useMpnOptions, useQuantityMultiplierV2
} from './../hooks/BOMTable';
import {useApiData, useApiDataProgress, useManufacturers} from './../hooks/BOMData';
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
    }, []), [props.bom]);
    const [mpnQuantityMap, setMpnQuantityMap] = useState(getInitMpnQuantityMap());
    const isLoadedBom = props.bomType === 'saved' || props.bomType === 'saved_nodata';
    const [updateTableCall, setUpdateTableCall] = useState(0);

    const highlightOptions = [
        {label: 'Price', id: 'price'}, 
        {label: 'Lead Time', id: 'leadtime'}
    ];
    const filterColours = {
        start: {show: true, colour: '#c7c7c7', display: 'To Start', toggle: false},
        normal: {show: true, colour: '#cafcd4', display: 'Complete', toggle: true},
        no_offers: {show: true, colour: '#de6c64', display: 'No Offers', toggle: true},
        retry: {show: true, colour: '#f2f0c9', display: 'Retry', toggle: true},
        error: {show: true, colour: '#db986e', display: 'Error', toggle: true}
    }
    const [filterStates, setFilterStates] = useState(filterColours); // to use to filter lines based on state
    const [algorithmMode, setAlgorithmMode] = useState({best: highlightOptions[0].id, stock: false});
    const [manufacturers, addManufacturerData] = useManufacturers(props.bom, props.manufacturerData, props.stringToManufacturer);
    const [quantityMultiplier, handleChangeMulti] = useQuantityMultiplierV2();
    const [callApiRetry, callMpn, callApisRetry, multiRetryData, singleRetryData, callOctopart, testNewMpns] = useApiData(mpnList, mpnListWithQuantity, allApisList, props.updateApiDataMap, 
        props.store, props.currency, props.apiData, props.bomType, props.loadData, 
        props.changeLock, props.octopartData, props.updateOctopartDataMap, 
        mpnQuantityMap);
    const [showProgress, handleHideBar, numMpns, mpnsInProgress,
         retrySingle, retryAll, retryLock, retryMpns] = useApiDataProgress(mpnList, allApisList, props.apiData, callApiRetry,
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
    const [tableBOM, filteredTableBOM, setTable, tableHeaders, 
        runBOMAlgorithms, runBOMLineAlgorithms, /*retryApis,*/
        changeMPNLine, changeQuantityLine, changeActiveApis, 
        changeTableActiveApisGlobal, changeWaitingRowApi, tableLock, octopartLineChange,
        filterManufacturerOffers] = useTableBOM(
        props.bom, props.tableHeaders, 
        props.apis, props.apiData, 
        updateTableCall, leadtimeCutOff, props.store, props.currency, /*dataProcessingLock,*/ props.changeLock,
        searchTerm, changeEvaluation, algorithmMode, quantityMultiplier, retryLock, retryMpns, multiRetryData, singleRetryData,
        filterStates, {get: mpnQuantityMap, set: setMpnQuantityMap}, props.manufacturerData, props.stringToManufacturer
    );
    const apiAttrs = props.apiAttrs;
    useEffect(() => {
        setMpnQuantityMap(getInitMpnQuantityMap());
    }, [props.bom]);
    function getInitMpnQuantityMap(){
        const mql = props.bom.reduce((arr, line) => {
            //console.log(line);
            line.mpnOptions.forEach(mpn => arr.push([mpn, line.quantity]));
            return arr;
        }, []);
        //const mqs = new Set(mql);
        const mqm = new Map(mql);
        return mqm;
    }
    function requestOctopart(row){
        const mpn = tableBOM[row].mpns.current;
        if(!props.octopartData.has(mpn)){
            console.log('no resdsq');
            callOctopart(mpn, row, octopartLineChange);
        }else{
            console.log('no req');
            console.log(props.octopartData.get(mpn));
            octopartLineChange(props.octopartData.get(mpn).data, row);
        }
    }
    function changeActiveApisGlobal(apis){
        const filteredApis = props.apis.reduce((arr, ap) => {
            if(apis[ap.accessor]) arr.push(ap);
            return arr;
        }, []);
        setDisplayApis(filteredApis);
        changeTableActiveApisGlobal(apis);
    }
    function retryApi(mpn, api, row){
        changeWaitingRowApi(row, [api]);
        retrySingle(mpn, api, row);
    }

    const [addMpnOption, editMpnOption, deleteMpnOption, changeMpnOption] = useMpnOptions(tableBOM, props.apiData,
        allApisList, setTable, callMpn, changeMPNLine);

    const functions = {
        mpns: {
            changeOption: changeMpnOption,
            addOption: addMpnOption,
            editOption: editMpnOption,
            deleteOption: deleteMpnOption,
        },
        quantities: {
            adjustQuantity: changeQuantityLine
        },
        activeApis: {
            submitNewApis: changeActiveApis,
            submitGlobalApis: changeActiveApisGlobal,
        },
        octopart: {
            requestOctopart: requestOctopart,
            selectOffer: selectOctopartOffer
        },
        api: {
            retry: retryApi
        },
        offer: {
            selectOffer: selectOffer
        },
        manu: {
            filterManufacturers: filterManufacturerOffers,
            addManufacturerData: addManufacturerData
        }
    }
    function selectOctopartOffer(row, api, offerNum, octoRowNum){
        console.log(row+api+offerNum+octoRowNum);
        const opp = !tableBOM[row].octopart.data[octoRowNum].offers[offerNum].selected;
        const newTable = update(tableBOM, {
            [row]: {octopart: {data: {[octoRowNum]: {offers: {[offerNum]: {selected: {$set: opp}}}}}}}
        });
        setTable(newTable);
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
        console.log(manufacturers);
        console.log(mpnQuantityMap);
        //testNewMpns();
        //runBOMAlgorithms();
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
    function handleFilterChange(filterName){
        setFilterStates(update(filterStates, {
            [filterName]: {
                show: {$set: !filterStates[filterName].show}
            }
        }));
    }
    function retAll(){
        retryAll();
    }
    function retryUntilFinished(){
        retryAll(true, retryMpns.get.length);
    }
    const canRetry = tableLock || retryMpns.get.length === 0;
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
            <div>
                <FilterStateInterface filterStates={filterStates} filterChange={handleFilterChange}/>
            </div>
            {<BOMExporterV2 data={tableBOM} apis={props.apis} bomAttrs={tableHeaders} 
            apiAttrs={apiAttrs} allApiAttrs={props.allApiAttrs} evaluation={bomEvaluation} algorithm={algorithmMode}/>}
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
            <Button onClick={retAll} disabled={canRetry}>Retry {retryMpns.get.length} MPN(s)</Button>
            <Button onClick={retryUntilFinished} disabled={canRetry}>Complete Retry</Button>
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
        <BOMAPITableV2 data={filteredTableBOM} bomAttrs={tableHeaders} 
        apis={displayApis} allApis={props.apis} apiAttrs={apiAttrs} functions={functions}
        algorithmMode={algorithmMode}  functionLock={tableLock}
        hasLineLocks onLineLockAll={handleLineLockAll} onLineLock={handleLineLock}
        tableState={tableState} filterStates={filterStates}/>
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

function FilterStateInterface(props){
    const shownFilters = Object.entries(props.filterStates).reduce((arr, [name, val]) => {
        const fsObj = {
            ...val,
            name: name
        }
        if(val.toggle) arr.push(fsObj);
        return arr;
    }, []);
    function handleChangeFilterState(fsName){
        return function(){
            props.filterChange(fsName);
        }
    }
    return(
        <>
        {/*shownFilters.map((fs, i) => {
            return <LabeledCheckbox key={i} label={fs.display} id={fs.name} className='Pointer'
            checked={fs.show} onChange={handleChangeFilterState(fs.name)}/>
        })*/}
        <ListGroup>
            {shownFilters.map((fs, i) => {
                const style = {
                    backgroundColor: fs.show ? fs.colour : 'white',
                    padding: '1px',
                    cursor: 'pointer'
                };
                return <ListGroup.Item key={i} style={style} onClick={handleChangeFilterState(fs.name)}>
                    {fs.display}
                </ListGroup.Item>;
            })}
        </ListGroup>
        </>
    )
}

export default BOMToolV3;