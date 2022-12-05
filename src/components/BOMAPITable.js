import {useState, useEffect} from 'react';
import styled from 'styled-components';

import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

import {useClientUrl} from './../hooks/Urls';
import {useServerUrl} from './../hooks/Urls';

import {SimplePopover, HoverOverlay} from './Tooltips';
import {PricingTable} from './Tables';
import {ModalController, TemplateModal} from './Modals';
import {MultiSelectRadioButtons, OutsideControlCheckbox, 
    AddRemoveEditSelectorForm,
    NumberInput, SelectorForm} from './Forms';
import {PageInterface} from './Pagination';
import {usePaging} from './../hooks/Paging';
import { MPNDropdown } from './Dropdown';

import {SuggestionSearcher} from './Searcher';

import {ManufacturerRenderer} from './SpecialRenderers';

//import {stockString} from './../scripts/AlgorithmVariable';
import {getStockModeString} from './../scripts/BomTool'

import { slice } from 'lodash';

import lockIcon from './../lock-128.png';

import './../css/table.css';
import './../css/offer.css';
import './../css/main.css';
import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';

const renderers = {
    //'mpn': (p) => <MPNRenderer {...p}/>,
    'mpns': (p) => <MPNsRenderer {...p}/>,
    'quantities': (p) => <QuantitiesRenderer {...p}/>,
    'prices': (p) => <PricesRenderer {...p}/>,
    'activeApis': (p) => <ActiveApisRenderer {...p}/>,
    'adjusted_quantity': (p) => <AdjustedQuantityRenderer {...p}/>,
    'excess_price': (p) => <ExcessPriceRenderer {...p}/>,
    'excess_quantity': (p) => <AdjustedQuantityRenderer {...p}/>,
    'display_total_price': (p) => <DisplayTotalPriceRenderer {...p}/>,
    'octopart': (p) => <OctopartRenderer {...p}/>,
    'fees': (p) => <FeesRenderer {...p}/>,
    'manu': (p) => <ManufacturerRenderer {...p}/>
};


const octoRenderers = {
    'prices': (p) => <PricesRenderer {...p}/>,
    'adjusted_quantity': (p) => <AdjustedQuantityRenderer {...p}/>,
    'excess_price': (p) => <ExcessPriceRenderer {...p}/>,
    'excess_quantity': (p) => <AdjustedQuantityRenderer {...p}/>,
    'display_total_price': (p) => <DisplayTotalPriceRenderer {...p}/>,
}

const headerRenderers = {
    'activeApis': (p) => <ActiveApisHeaderRenderer {...p}/>,
    'moq': (p) => <LongHeaderTooltipRenderer {...p}/>,
    'spq': (p) => <LongHeaderTooltipRenderer {...p}/>,
    'leadtime': (p) => <LeadTimeHeaderRenderer {...p}/>,
    'display_total_price': (p) => <LongHeaderTooltipRenderer {...p}/>,
    'adjusted_quantity': (p) => <LongHeaderTooltipRenderer {...p}/>,
    'excess_quantity': (p) => <LongHeaderTooltipRenderer {...p}/>,
    'excess_price': (p) => <LongHeaderTooltipRenderer {...p}/>,
    'distributor_code': (p) => <LongHeaderTooltipRenderer {...p}/>,
};


const defaultRenderer = (p) => <DefaultRenderer/>

function smartAttr(type, funs, vars, rendererList){
    return function(attr){
        const custom = (attr.accessor in rendererList)
        ? rendererList[attr.accessor] : null;
        const functions = (attr.accessor in funs)
        ? funs[attr.accessor] : null;
        const vr = (attr.accessor in vars) ? vars[attr.accessor] : {};
        const lh = ('longHeader' in attr) ? attr.longHeader : null;
        return {
            attribute: attr.accessor,
            header: attr.Header,
            longHeader: lh,
            type: type,
            custom: custom, // custom renderer for cell?
            vars: vr,
            functions: functions
        };
    }
}

export function BOMAPITableV2(props){
    //console.log(props.data);
    const bomAttrs = props.bomAttrs;
    const apis = props.apis; //apis to display
    const allApis = props.allApis; // all possible apis
    const apiAttrs = props.apiAttrs;
    const apisToHeader = allApis.reduce((obj, api) => {
        obj[api.accessor] = api.Header;
        return obj;
    }, {});
    const normalAttributes = bomAttrs.map(smartAttr('normal', props.functions, {octopart: {apiAttrs: props.apiAttrs}}, renderers));
    /*const normalAttributes = props.bomAttrs.map((attr) => {
        const custom = (attr.accessor in renderers)
        ? renderers[attr.accessor] : null;
        const functions = (attr.accessor in props.functions)
        ? props.functions[attr.accessor] : null;
        return {
            attribute: attr.accessor,
            type: 'normal',
            custom: custom, // custom renderer for cell?
            functions: functions
        };
    });*/
    const apiAttributes = apis.map((api) => {
        const sa = apiAttrs.map(smartAttr('subattr', props.functions, {}, renderers));
        return {
            attribute: api.accessor,
            subAttributes: sa,
            type: 'api',
            custom: (p) => <APIRenderer {...p}/>,
            functions: props.functions.api
        }
    });
    /*
    const apiAttributes = apis.map((api) => {
        const sa = apiAttrs.map((attr) => {
            const custom = (attr.accessor in renderers)
            ? renderers[attr.accessor] : null;
            const saFunctions = (attr.accessor in props.functions)
            ? props.functions[attr.accessor] : null;
            return {
                attribute: attr.accessor,
                type: 'subattr',
                custom: custom,
                functions: saFunctions
            }
        });
        return {
            attribute: api.accessor,
            subAttributes: sa,
            type: 'api',
            custom: (p) => <APIRenderer {...p}/>,
            functions: props.functions.api
        }
    });*/
    const tbs = props.tableState === 'APIs';
    const attributeOrder = tbs ? normalAttributes.concat(apiAttributes) : normalAttributes;

    const apiHeaderAttributes = apis.map((api) => {
        const sa = apiAttrs.map(smartAttr('subattr', props.functions, {}, renderers));
        return {
            header: api.accessor,
            subAttributes: sa,
            type: 'api',
            custom: (p) => <APIRenderer {...p}/>,
            functions: props.functions.api
        }
    });
    const extendedApiAttrs = apiAttrs.concat([
        {Header: 'Distributor', accessor: 'distributor'}, 
        //{Header: 'Total Price', accessor: 'totalPrice'}
    ]);
    const extApiAttrs = extendedApiAttrs.map(smartAttr('normal', props.functions, {}, renderers));
    const bestAttributeOrder = normalAttributes.concat(extApiAttrs);
    //const headerOrder = [];
    const [pageSize, setPageSize] = useState(5);
    const [pageNumber, numPages, handlePageChange] = usePaging(props.data.length, pageSize);
    const displayWidth = 3;
    const pageRows = props.data.slice(pageNumber*pageSize, +(pageNumber*pageSize) + +pageSize);
    function handleChangePageSize(s){
        setPageSize(s);
        handlePageChange(0);
    }
    useEffect(() => {
        
    }, [props.data]);
    return (
        <>
        <div className='MainTable'>
        <Table>
            {
            <BOMAPITableHeader hasLineLocks={props.hasLineLocks} bomAttrs={bomAttrs} 
            apis={apis} allApis={allApis} apiAttrs={apiAttrs} onLockAll={props.onLineLockAll} 
            functions={props.functions} tableState={props.tableState} extendedApiAttrs={extendedApiAttrs}/>
            }
            <tbody>
                {pageRows.map((line, i) => 
                    <BOMRow key={i} algorithmMode={props.algorithmMode} rowNum={line.rowNum} 
                    data={line} hasLineLocks={props.hasLineLocks} mpn={line.mpns.current}
                    attributeOrder={attributeOrder} functionLock={props.functionLock} offerFunctions={props.functions.offer}
                    onLineLock={props.onLineLock} bestAttributeOrder={bestAttributeOrder}
                    tableState={tbs} apisToHeader={apisToHeader} apis={apis} allApis={allApis} filterStates={props.filterStates}/>
                )}
            </tbody>
        </Table>
        </div>
        <div className='PageInterface'>
        <PageInterface current={pageNumber} max={numPages} 
        displayWidth={displayWidth} onPageClick={handlePageChange} 
        pageSize={pageSize} onChangePageSize={handleChangePageSize}/>
        </div>
        </>
    );
}

//vertical-align to center header elements for rowspan=2
function BOMAPITableHeader(props){
    const tbs = props.tableState === 'APIs';
    const numApiAttrs = props.apiAttrs.length;
    function handleAllLock(){
        props.onLockAll(true);
    }
    function handleRemoveAllLock(){
        props.onLockAll(false);
    }
    const vars = {
        'activeApis': {apis: props.apis, allApis: props.allApis}
    }
    /*
    function smartAttr(type){
        return function(attr){
            const custom = (attr.accessor in headerRenderers)
            ? headerRenderers[attr.accessor] : null;
            const functions = (attr.accessor in props.functions)
            ? props.functions[attr.accessor] : null;
            const vr = (attr.accessor in vars) ? vars[attr.accessor] : {};
            return {
                header: attr.Header,
                type: type,
                custom: custom, // custom renderer for cell?
                vars: vr,
                functions: functions
            };
        }
    }*/
    const normalAttributes = props.bomAttrs.map(smartAttr('normal', props.functions, vars, headerRenderers));
    const apiAttrAttributes = props.apiAttrs.map(smartAttr('subattr', props.functions, vars, headerRenderers));
    const apiAttributes = props.apis.map(smartAttr('api', props.functions, vars, headerRenderers));
    const extendedApiAttrs = props.apiAttrs.concat([
        {Header: 'Distributor', accessor: 'distributor'}, 
        //{Header: 'Total Price', accessor: 'total_price'}
    ]);
    const bestAttrs = extendedApiAttrs.map(smartAttr('subattr', props.functions, vars, headerRenderers));
    const normHeaderProps = {
        rowSpan: '2',
        className: 'VerticalAlign'
    }
    const apiHeaderProps = {
        colSpan: numApiAttrs,
    }
    return(
    <thead className='TableHeading'>
        <tr>
        {props.hasLineLocks && 
        <th rowSpan='2'>
            <HoverOverlay tooltip='Lock All Lines' placement='auto'>
            <LineLock checked={true} onLineLock={handleAllLock}/>
            </HoverOverlay>
            /
            <HoverOverlay tooltip='Unlock All Lines' placement='auto'>
            <LineLock checked={false} onLineLock={handleRemoveAllLock}/>
            </HoverOverlay>
        </th>
        }
        {normalAttributes.map((attr,i) =>
            <HeaderRenderer key={i} {...attr} headerProps={normHeaderProps}/>
        )}
        {tbs && apiAttributes.map((attr, i) =>
            <HeaderRenderer key={i} {...attr} headerProps={apiHeaderProps}/>
        )}
        </tr>
        <tr>
        {tbs && props.apis.map((api, i) => 
            apiAttrAttributes.map((attr, i) => 
                <HeaderRenderer key={i} {...attr}/>
            )
        )}
        {!tbs && bestAttrs.map((attr, i) => 
            <HeaderRenderer key={i} {...attr} headerProps={{rowSpan: '2', className: 'VerticalAlign'}}/>
        )}
        </tr>
    </thead>
    );
}

const HoverToggleSolidColour = styled.div`
    height: 15px;
    background: ${props => props.toggle ? 'rgb(152, 210, 217)' : 'rgb(202, 205, 207)'};
    &:hover {
        background: rgb(122, 155, 167);
    }
`;

function BOMRow(props){
    const [showAllOffers, setShowAllOffers] = useState(false);
    const rowColour = props.filterStates[props.data.status].colour;
    function changeShowOffers(){
        setShowAllOffers(!showAllOffers);
    }
    const maxOffers = getMaxOffers();
    //console.log(maxOffers);
    const rs = showAllOffers && maxOffers > 0 && props.tableState ? maxOffers : 1;
    const firstRowCellProps = {
        rowSpan: rs,
        style: {background: rowColour}
    }
    const numTableCols = props.attributeOrder.reduce((c, attr) => {
        if(attr.type == 'api'){
            return c+attr.subAttributes.length;
        }
        return c+1;
    }, 0) + (props.hasLineLocks ? 1 : 0);
    function handleLineLock(){
        props.onLineLock(!props.data.lineLock, props.rowNum);
    }
    function getMaxOffers(){
        if(props.apis.length === props.allApis.length) return props.data.max_offers;
        //console.log('t');
        return props.apis.reduce((max, api) => {
            if(props.data[api.accessor].offers.length > max) return props.data[api.accessor].offers.length;
            return max;
        }, 0);
    }
    const lockTTip = props.data.lineLock ? 'Unlock Line' : 'Lock Line';
    const attributeOrder = props.tableState ? props.attributeOrder : props.functionLock ? props.attributeOrder : props.bestAttributeOrder;
    const stockMode = getStockModeString(props.algorithmMode.stock);
    const hl = 'best' in props.data ? props.data.best[stockMode][props.algorithmMode.best] : null;
    const bestOffer = hl ? props.data[hl.api].offers[hl.offer_num] : null;
    const data = props.tableState ? props.data : {
        ...props.data,
        ...bestOffer,
        distributor: hl ? props.apisToHeader[hl.api] : ''
    };
    return(
        <>
        <tr>
            {props.hasLineLocks &&
                <td {...firstRowCellProps}>
                    <HoverOverlay tooltip={lockTTip} placement='auto'>
                    <LineLock checked={props.data.lineLock} onLineLock={handleLineLock}/>
                    </HoverOverlay>
                </td>
            }
            {
            <BOMOffer offerNum={0} rowNum={props.rowNum} attributeOrder={attributeOrder} tableState={props.tableState}
            data={data} cellProps={firstRowCellProps} algorithmMode={props.algorithmMode} 
            lock={props.data.lineLock} functionLock={props.functionLock} mpn={props.mpn} offerFunctions={props.offerFunctions}/>
            }
        </tr>
        {maxOffers > 1 && showAllOffers && props.tableState && 
        [...Array(maxOffers-1).keys()].map((i) => {
            const offerNum = i+1;
            return(
            <tr key={i}>       
                <BOMOffer offerNum={offerNum} rowNum={props.rowNum} attributeOrder={props.attributeOrder} 
                data={props.data} algorithmMode={props.algorithmMode} mpn={props.mpn} offerFunctions={props.offerFunctions}/>
            </tr>
            );
        })}
        {maxOffers > 1 && props.tableState && 
        <tr onClick={changeShowOffers}>
            <td colSpan={numTableCols} className='NoPadding'>
            <HoverOverlay placement='auto' 
            tooltip={showAllOffers ? 'Close offers' : 'Open offers'}>
            <HoverToggleSolidColour toggle={showAllOffers}/>
            </HoverOverlay>
            </td>
        </tr>
        }
        </> 
    );
}

function BOMOffer(props){
    const attrOrder = props.offerNum === 0 ? props.attributeOrder
    : props.attributeOrder.reduce((arr, attr) => {
        if(attr.type === 'api'){
            arr.push(attr);
        }
        return arr;
    }, []);
    //const cellProps = props.offerNum === 0 ? {rowSpan: props.data.maxOffers} : {};
    return (
        <>
        {attrOrder.map((attr, i) => {
            const stockMode = getStockModeString(props.algorithmMode.stock);
            const specAttrs = attr.type === 'api' 
            ? {
                //highlight: props.data.highlights[stockMode],
                api: attr.attribute,
                algorithmMode: props.algorithmMode.best,
                mpns: props.data.mpns
            } 
            : {};
            //console.log(props.data.highlights[stockMode]);
            //if(props.data[attr.attribute]) console.log(props.data[attr.attribute].offer_order);
            const offerNum = attr.type === 'api' && props.data[attr.attribute]
            ? props.data[attr.attribute].offer_order[stockMode][props.algorithmMode.best][props.offerNum] 
            : props.offerNum;
            //offerNum is the sorted index order, offerIndex is the index of original data i.e. 0,1,2 etc.
            {/*<BOMAttributeRenderer key={i} {...specAttrs} {...attr} cellProps={props.cellProps}
                value={props.data[attr.attribute]} offerNum={offerNum} offerIndex={props.offerNum} rowNum={props.rowNum} 
            lock={props.lock} stockMode={stockMode} functionLock={props.functionLock} mpn={props.mpn}/>*/}
            return (
                <BOMAttributeRenderer key={i} {...specAttrs} {...attr} cellProps={props.cellProps}
                value={props.data[attr.attribute]} offerNum={offerNum} offerIndex={props.offerNum} rowNum={props.rowNum} 
                lock={props.lock} stockMode={stockMode} functionLock={props.functionLock} offerFunctions={props.offerFunctions} mpn={props.mpn}/>
            );
        })}
        </>
    );
}

function BOMAttributeRenderer(props){
    //add global clickability here
    const custom = props.custom ? props.custom({...props}) : <DefaultRenderer {...props}/>;
    return(
        <>
        {props.type === 'normal' ?
        <td {...props.cellProps}>
        {custom}
        </td>
        : <>{custom}</>
        }
        </>
    );
}

function APIAttributeRenderer(props){
    //console.log(props.custom);
    //console.log(props.functions);
    function handleClick(e){
        //if(!props.octopart){
        if(e.ctrlKey){
            window.open(props.url, '_blank');
        }else{
            if(props.octopart){
                if(props.functions) props.functions.selectOffer(props.rowNum, props.api, props.offerNum, props.octoRowNum);
            }else{
                if(props.functions) props.functions.selectOffer(props.rowNum, props.api, props.offerNum);
            }

        }
        //}
    }
    
    return(
        <td {...props.cellProps} onClick={handleClick}>
            {props.custom ? props.custom({...props}) : <DefaultAPIAttributeRenderer {...props}/>}
        </td>
    );
}

function DefaultAPIAttributeRenderer(props){
    return (<>{props.value}</>);
}



function APIRenderer(props){
    /*
    const hasHighlight = Object.entries(props.highlight).reduce((obj, [k, v]) => {
        if(v !== null){
            obj[k] = v.offer_num === props.offer_num && v.api === props.api;
        }
        return obj;
    }, {});*/
    let cn = 'NormalCell';
    if(props.value && props.value.offers.length > 0 && props.offerNum < props.value.offers.length){
        if(props.value.offers[props.offerNum].best){
            cn = 'HighlightedCell';
        }
        if(props.value.offers[props.offerNum].selected){
            cn = 'SelectedCell';
        }
    }
    /*let cn = (props.algorithmMode in hasHighlight) 
    ? (hasHighlight[props.algorithmMode] ? 'HighlightedCell' : 'NormalCell') 
    : 'NormalCell';
    if(props.value && props.value.offers.length > 0 && props.offerNum < props.value.offers.length){
        if(props.value.offers[props.offerNum].selected){
            cn = 'SelectedCell';
        }
    }*/
    const cellProps = {
        className: cn
    };
    function handleRetry(){
        props.functions.retry(props.mpns.current, props.api, props.rowNum);
    }
    return(
        <>
        {props.value 
        ? ((props.value.offers.length > 0 && props.offerNum < props.value.offers.length)
        ? props.subAttributes.map((attr, i) => {
            /*
            <BOMAttributeRenderer key={i} value={props.value.offers[props.offerNum][attr.attribute]}
                custom={attr.custom} type='normal' rowNum={props.rowNum} cellProps={cellProps}
                stockMode={props.stockMode} algorithmMode={props.algorithmMode}/>
            */
            return (
                <APIAttributeRenderer key={i} value={props.value.offers[props.offerNum][attr.attribute]}
                custom={attr.custom} type='apiAttr' offerNum={props.offerNum} rowNum={props.rowNum} cellProps={cellProps} api={props.api}
                stockMode={props.stockMode} algorithmMode={props.algorithmMode} functions={props.offerFunctions} url={props.value.offers[props.offerNum].url}/>
            )
        })
        : <td colSpan={props.subAttributes.length}>
            {props.offerIndex === 0 &&
            <div>
            {props.value.message} {' '}
            {props.value.retry && <Button onClick={handleRetry}>Retry</Button>}
            </div>
            }
        </td>
        )
        :  <td colSpan={props.subAttributes.length}>Waiting...</td>
        }
        </>
    );
}

//vertical-align to center header elements for rowspan=2

function HeaderRenderer(props){
    return(
        <>
        {props.custom ? props.custom({...props}) : <DefaultHeader {...props}/>}
        </>
    );
}
function DefaultHeader(props){
    return(
        <th {...props.headerProps}>{props.header}</th>
    );
}

function LineLock(props){
    return(
        <input className='form-check-input Lock' type='checkbox' 
        checked={props.checked} onChange={props.onLineLock}/>
    );
}

function MPNRenderer(props){
    const clientUrl = useClientUrl();
    const mpn = props.value;
    function handleMPNClick(){
        window.open(clientUrl+'partdetails/'+mpn, '_blank');
    }
    return(
        <>{mpn}</>
    );
}

function MPNsRenderer(props){
    const [editSelector, setEditSelector] = useState(false);
    const [isAdd, setIsAdd] = useState(false);
    const [selectedMPN, setSelectedMPN] = useState(props.value.current);
    const clientUrl = useClientUrl();
    const mpn = props.value.current;
    function handleMPNClick(e){
        if(!props.lock && !props.functionLock){
            if(e.ctrlKey){
                window.open(clientUrl+'/partdetails/'+mpn, '_blank');
            }
            else if(e.shiftKey){
                setEditSelector(true);
            }else if(e.altKey){
                if(props.value.options.length > 1){
                    console.log('delete');
                    props.functions.deleteOption(props.rowNum, mpn);
                }
            }
        }
    }
    function handleAddMpn(newMpn){
        setIsAdd(false);
        setEditSelector(false);
        props.functions.addOption(props.rowNum, newMpn);
    }
    function handleEditMpn(newMpn){
        setEditSelector(false);
        //console.log(mpn+' : '+newMpn);
        props.functions.editOption(props.rowNum, mpn, newMpn);
    }
    function handleBlurMpn(v){
        //console.log(props.functionLock);
        if(!props.lock && !props.functionLock){
            if(v === 'addNew'){
                setEditSelector(true);
                setIsAdd(true);
            }else{
                props.functions.changeOption(props.rowNum, v);
            }
    }
    }
    const showSelector = props.value.options.length > 1;
    const tooltipText = 'Select MPN options | shift-click to edit | ctrl-click for details | alt-click delete current';
    return(
    <>
        <HoverOverlay tooltip={tooltipText}>
        <div className='Select' onClick={handleMPNClick}>
            {/*showSelector
            ? <AddRemoveEditSelectorForm onSelect={handleBlurMpn} options={props.value.options}/> 
            : mpn AddRemoveEditSelectorForm
            */}
            {<MPNDropdown edit={editSelector} isAdd={isAdd} onSelect={handleBlurMpn} 
            options={props.value.options} selected={mpn} 
            onEdit={handleEditMpn} onAdd={handleAddMpn}
            disabled={props.lock || props.functionLock}/> }
            
        </div>
        </HoverOverlay>
    </> 
    );
}

function QuantitiesRenderer(props){
    function handleBlur(newQuantity){
        props.functions.adjustQuantity(newQuantity, props.rowNum);
    }
    const quantPop = (
        <div>
            Single: {props.value.single}{' '}Multi: {props.value.multi}
        </div>
    );
    //<td {...props.cellProps}>
    //</td>
    return (
        <>
            <SimplePopover popoverBody={quantPop} trigger={['hover', 'focus']} placement='auto'>
            <div><NumberInput onBlur={handleBlur} value={props.value.single} disabled={props.lock || props.functionLock}/></div>
            </SimplePopover>
        </>
    );
}

function priceDisplay(price){
    return parseFloat(price.toFixed(4));
}

function PricesRenderer(props){
    const pt = props.value && props.value.index ? 
    <>
    <NewPricingTable pricing={props.value.pricing} highlight={props.value.index[props.stockMode]}/>
    </> : <></>;
    //<SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'></SimplePopover>
    return (
        <>
        <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
            <div>{props.value && props.value.price && priceDisplay(props.value.price[props.stockMode])}</div>
        </SimplePopover>
        </>
    );
}

function FeesRenderer(props){
    const pt = (
        <div>
            {props.value && Object.entries(props.value.fees).map(([fee_name, value], i) => {
                return <div key={i}>{fee_name}: {value}</div>
            })}
        </div>
    );
    return (
        <>
        {props.value && Object.keys(props.value.fees).length > 0 ? 
        <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
            <div>{props.value.total}</div>
        </SimplePopover> 
        : <div>{props.value && props.value.total}</div>
        }
        </>
    )
}

function DisplayTotalPriceRenderer(props){
    const pt = (
        <div>
            {props.value && props.value[props.stockMode].prices.map((p, i) => {
                return <div key={i}>{p.name}: {p.value}</div>
            })}
        </div>
    )
    return (
    <>
    <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
        <div>{props.value && priceDisplay(props.value[props.stockMode].total)}</div>
    </SimplePopover> 
    </>
    );
}

function AdjustedQuantityRenderer(props){
    const display = props.value ? props.value[props.stockMode] : '-';
    return (
        <>
        {display}
        </>
    );
}

function ExcessPriceRenderer(props){
    const display = props.value ? priceDisplay(props.value[props.stockMode]) : '-';
    return (
        <>{display}</>
    );
}
/*
function ManufacturerRenderer(props){
    console.log(props.value);
    const serverUrl = useServerUrl();
    const [manufacturerModal, setManufacturerModal] = useState(false);
    const [searchResults, setSearchResults] = useState(new Map());
    const [chosenSuggestion, setChosenSuggestion] = useState(null);
    const [updater, setUpdater] = useState(0);
    const suggestionSize = 5;
    const bd = (
        <div>
        <SuggestionSearcher searchTerm={chosenSuggestion ? chosenSuggestion.name : null} 
        recommends={[...searchResults.keys()]} onSearch={handleSearch} 
        onClickSuggestion={handleClickSuggestion} size={suggestionSize} updater={updater}/>
        {chosenSuggestion && 
        <div>
            <div>Name: {chosenSuggestion.name}</div>
            <div>ID: {chosenSuggestion.id}</div>
        </div>
        }
        <
        </div>
    );
    function handleSearch(st){
        axios({
            method: 'GET',
            url: serverUrl+'api/manufacturer',
            params: {search: st, limit: suggestionSize}
        }).then((response) => {
            console.log(response);
            const data = response.data;
            const mp = new Map();
            data.search.forEach((manu) => {
                mp.set(manu.name, manu.id);
            })
            setSearchResults(mp);
        });
    }
    function handleClickSuggestion(suggestion){
        const cs = {
            name: suggestion,
            id: searchResults.get(suggestion)
        }
        setSearchResults(new Map());
        setChosenSuggestion(cs);
        setUpdater(updater+1);
    }
    function handleOpenModal(){
        setManufacturerModal(true);
    }
    function handleCloseModal(){
        setManufacturerModal(false);
    }
    return(
        <>
        <Button onClick={handleOpenModal}>Manufacturers</Button>
        <TemplateModal show={manufacturerModal} title='Manufacturer' body={bd} onClose={handleCloseModal}/>
        </>
    );
}*/

function ApiManufacturerRenderer(props){
    return(
        <></>
    );
}

function ActiveApisRenderer(props){
    const apisActivator = (
        <Button disabled={props.lock}>Select</Button>
    );
    const apis = props.value.map((api) => {
        return {id: api.accessor, label: api.Header};
    });
    const init = props.value.reduce((obj, api) => {
        obj[api.accessor] = api.active;
        return obj;
    }, {});
    const [apiModal, setApiModal] = useState(false);
    const [activeApis, setActiveApis] = useState(init);
    const [initActiveApis, setInitActiveApis]= useState(init); // onload
    function onChangeApi(newActiveApis){
        setActiveApis(newActiveApis);
    }
    function handleOpenModal(){
        setActiveApis(initActiveApis);
        setApiModal(true);
    }
    function handleCloseModal(){
        setApiModal(false);
    }
    function onSubmit(){
        props.functions.submitNewApis(activeApis, props.rowNum);
        console.log(activeApis);
        setInitActiveApis()
        //setShowModal(showModal+1);
        handleCloseModal();
    };
    const apisCheckboxes = (
        <MultiSelectRadioButtons className='Pointer' control={activeApis}  options={apis} onChange={onChangeApi}/>
    );
    const footer = (
        <>
        <Button onClick={onSubmit} disabled={props.lock}>Submit</Button>
        <Button variant='secondary' onClick={handleCloseModal}>Close</Button>
        </>
    );
    return (
        <>
        <Button disabled={props.lock || props.functionLock} onClick={handleOpenModal}>Apis</Button>
        <TemplateModal show={apiModal} title='Select APIs' body={apisCheckboxes} footer={footer} onClose={handleCloseModal}/>
        {/*<ModalController hide={showModal} activateModal={apisActivator} title='Select APIs' 
        body={apisCheckboxes} footer={footer}/>*/}
        </>
    )
}

function LongHeaderTooltipRenderer(props){
    return (
        <th {...props.headerProps}>
            <HoverOverlay tooltip={props.longHeader} placement='auto'>{props.header}</HoverOverlay>
        </th>
    );
}

function ActiveApisHeaderRenderer(props){
    const apis = props.vars.allApis.map((api) => {
        return {id: api.accessor, label: api.Header};
    });
    const init = props.vars.allApis.reduce((obj, api) => {
        obj[api.accessor] = true;
        return obj;
    }, {});
    const [apiModal, setApiModal] = useState(false);
    const [activeApis, setActiveApis] = useState(init);
    const [initActiveApis, setInitActiveApis]= useState(init); // onload
    function handleOpenModal(){
        setActiveApis(initActiveApis);
        setApiModal(true);
    }
    function handleCloseModal(){
        setApiModal(false);
    }
    function onChangeApi(newActiveApis){
        //console.log(newActiveApis);
        setActiveApis(newActiveApis);
    }
    function onSubmit(){
        props.functions.submitGlobalApis(activeApis);
        setInitActiveApis(activeApis);
        handleCloseModal();
    };
    const apisActivator = (
        <Button disabled={props.lock}>Apis</Button>
    );
    const apisCheckboxes = (
        <MultiSelectRadioButtons className='Pointer' control={activeApis} options={apis} onChange={onChangeApi}/>
    );
    const footer = (
        <>
        <Button variant='primary' onClick={onSubmit}>Submit</Button>
        <Button variant='secondary' onClick={handleCloseModal}>Close</Button>
        </>
    );
    return(
        <th {...props.headerProps}>
            <Button disabled={props.lock || props.functionLock} onClick={handleOpenModal}>Apis</Button>
            <TemplateModal show={apiModal} title='Select APIs' body={apisCheckboxes} footer={footer} onClose={handleCloseModal}/>
        </th>
    );
}

function LeadTimeHeaderRenderer(props){
    return(
        <th {...props.headerProps}>
            <HoverOverlay tooltip='In weeks' placement='auto'>
                {props.header}
            </HoverOverlay>
        </th>
    );
}

function DefaultRenderer(props){
    return(
        <>{props.value}</>
    )
}

function OctopartRenderer(props){
    const [showModal, setShowModal] = useState(0);
    const [modalOn, setModalOn] = useState(false);
    const activator = (
        <Button onClick={() => setModalOn(true)} disabled={props.lock || props.functionLock}>Request</Button>
    );
    function onClose(){
        setShowModal(showModal+1);
        setModalOn(false)
    };
    //const [octoData, setOctoData] = useState([]);
    useEffect(() => {
        if(modalOn /*&& !octoRequested*/){
            props.functions.requestOctopart(props.rowNum, callbackOctoRequest);
            console.log('req octo');
            //setOctoRequested(true);
        }
        console.log(modalOn);
    }, [modalOn]);
    function callbackOctoRequest(od){
        //setOctoData(od);
    }
    /*
    function onOctopart(){
        props.functions.requestOctopart(props.rowNum, callbackOctoRequest);
    }*/
    const title = 'Octopart Offers for '+props.mpn;
    const body = (
        <>
        {/*!isProduction && <Button onClick={onOctopart}>Octopart</Button>*/}
        {props.value.data && props.value.data.length > 0 && <OctopartTable data={props.value.data} stockMode={props.stockMode} 
        apiAttrs={props.vars.apiAttrs} rowNum={props.rowNum} functions={props.functions}/>}
        </>
    );
    const footer = <Button variant='secondary' onClick={onClose}>Close</Button>
    return (
        <>
            <ModalController modalClass='OctopartOffers' hide={showModal} activateModal={activator} title={title} body={body} footer={footer}/>
        </>
    );
}

export function OctopartTable(props){
    //console.log(props.data);
    const octoHeaders = [{Header: 'Distributor', accessor: 'distributor'}];
    //const offerHeaders = props.apiAttrs;
    const unneccessaryOfferHeaders = ['fees', 'distributor_code'];
    const offerHeaders = props.apiAttrs.reduce((arr, attr) => {
        if(!unneccessaryOfferHeaders.includes(attr.accessor)){
            arr.push(attr);
        }
        return arr;
    }, []);
    const headers = octoHeaders.concat(offerHeaders);
    const octoAttributes = octoHeaders.map(smartAttr('octopart', {}, {}, octoRenderers));
    const offerAttributes = offerHeaders.map(smartAttr('subattr', {}, {}, octoRenderers));
    //const attributes = octoAttributes.
    //console.log(offerAttributes);
    return (
    <Table>
        <thead>
            <tr>
            {headers.map((header, i) => {
                return <th key={i}>{header.Header}</th>;
            })}
            </tr>
        </thead>
        <tbody>
            {props.data.map((dataObj, i) => {
                //console.log(dataObj);
                return (
                    <OctopartRow key={i} octoRowNum={i} data={dataObj} octoAttrs={octoAttributes} 
                    offerAttrs={offerAttributes} stockMode={props.stockMode} rowNum={props.rowNum}
                    functions={props.functions}/>
                );
            })}
        </tbody>
    </Table>
    );
}

function OctopartRow(props){
    const rows = props.data.offers.length;
    const [showAllOffers, setShowAllOffers] = useState(false);
    const octoCellProps = showAllOffers ? {
        rowSpan: rows,
    } : {};
    function changeShowOffers(){
        setShowAllOffers(!showAllOffers);
    }
    const numTableCols = props.octoAttrs.length + props.offerAttrs.length;
    const fns = {
        selectOffer: (rn, api, on, orn) => {console.log(rn+api+on+orn)}
    }
    return(
        <>
        <tr>
        {props.data && props.data.offers.length > 0 && props.octoAttrs.map((attr, i) => {
            return <BOMAttributeRenderer key={i} value={props.data[attr.attribute]} type={'normal'} custom={attr.custom} cellProps={octoCellProps} stockMode={props.stockMode}/>;
        })}
        {props.data.offers.length > 0 && 
        <OctoOffer offer={props.data.offers[0]} functions={props.functions} offerAttrs={props.offerAttrs} stockMode={props.stockMode} rowNum={props.rowNum}
        offerNum={0} octoRowNum={props.octoRowNum} api={props.data.distributor}/>
        /*props.offerAttrs.map((attr, i) => {
            return <APIAttributeRenderer key={i} value={props.data.offers[0][attr.attribute]} custom={attr.custom} 
            stockMode={props.stockMode} url={props.data.offers[0].url} functions={props.functions} octopart
            rowNum={props.rowNum} api={props.data.distributor} offerNum={0} octoRowNum={props.octoRowNum}/>
        
        })*/}
        </tr>
        {props.data && props.data.offers.length > 1 && showAllOffers && 
        [...Array(props.data.offers.length-1).keys()].map((i) => {
            const offerNum = i+1;
            return(
            <tr key={i}>
                <OctoOffer offer={props.data.offers[offerNum]} functions={props.functions} offerAttrs={props.offerAttrs} stockMode={props.stockMode} rowNum={props.rowNum}
                offerNum={offerNum} octoRowNum={props.octoRowNum} api={props.data.distributor}/>
                {/*props.offerAttrs.map((attr, j) => {
                    return <APIAttributeRenderer key={j} value={props.data.offers[offerNum][attr.attribute]} custom={attr.custom} 
                    stockMode={props.stockMode} url={props.data.offers[0].url} functions={props.functions} octopart
                    rowNum={props.rowNum} api={props.data.distributor} offerNum={offerNum} octoRowNum={props.octoRowNum}/>
                })*/}
            </tr>
            );
        })}
        {props.data.offers.length > 1 && 
            <tr onClick={changeShowOffers}>
                <td colSpan={numTableCols} className='NoPadding'>
                <HoverOverlay placement='auto' 
                tooltip={showAllOffers ? 'Close offers' : 'Open offers'}>
                <HoverToggleSolidColour toggle={showAllOffers}/>
                </HoverOverlay>
                </td>
            </tr>
        }
        </>
    )
}

function OctoOffer(props){
    let cn = props.offer.selected ? 'SelectedCell' : 'NormalCell';
    /*
    if(props.offer.selected && props.value.offers.length > 0 && props.offerNum < props.value.offers.length){
        if(props.value.offers[props.offerNum].selected){
            cn = 'SelectedCell';
        }
    }*/
    const offerProps = {
        className: cn
    }
    return(
        <>
        {props.offerAttrs.map((attr, j) => {
            return <APIAttributeRenderer key={j} value={props.offer[attr.attribute]} custom={attr.custom} cellProps={offerProps}
            stockMode={props.stockMode} url={props.offer.url} functions={props.functions} octopart
            rowNum={props.rowNum} api={props.api} offerNum={props.offerNum} octoRowNum={props.octoRowNum}/>
        })}
        </>
    )
}

function OctoPricesRenderer(props){
    const pt = props.value && props.value.index ? <NewPricingTable pricing={props.value.pricing} highlight={props.value.index[props.stockMode]}/> : <></>;
    return (
        <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
            <td {...props.cellProps}>{props.value && props.value.price[props.stockMode]}</td>
        </SimplePopover>
    );
}

function NewPricingTable(props){
    return(
        <>
        {props.pricing &&
        <Table bordered hover className='PricingTable'>
            <thead>
            <tr>
            <th>Break Quantity</th><th>Price</th>
            </tr>
            </thead>
            <tbody>
            {props.pricing.map((bracket, i) => {
                const cn = props.highlight == i ? 'PricingCell HighlightedCell' : 'PricingCell'; 
                return(
                <tr key={i}>
                    <td className={cn}>{bracket.break_quantity}</td>
                    <td className={cn}>{bracket.unit_price}</td>
                </tr>
                )}
            )}
            </tbody>
        </Table>
        }
        </>
        );
}

const singleRenderers = {
    'pricing': (p) => <SinglePricesRenderer {...p}/>,
    'fees': (p) => <FeesRenderer {...p}/>,
};

export function SingleAPITable(props){
    const mainHeaders = [{Header: 'Distributor', accessor: 'distributor'}];
    const headers =  mainHeaders.concat(props.apiAttrs);
    const mainAttrs = mainHeaders.map(smartAttr('single', {}, {}, singleRenderers));
    const offerAttrs = props.apiAttrs.map(smartAttr('single', {}, {}, singleRenderers));
    return(
        <div className='MainTable'>
        <Table>
        <thead>
            <tr>
            {headers.map((header, i) => {
                return <th key={i}>{header.Header}</th>;
            })}
            </tr>
        </thead>
        <tbody>
        {props.data.map((dataObj, i) => {
                return (
                    <APIRow key={i} data={dataObj} mainAttrs={mainAttrs} 
                    offerAttrs={offerAttrs} stockMode={props.stockMode}/>
                );
            })}
        </tbody>
        </Table>
        </div>
    )
}

function APIRow(props){
    const rows = props.data.offers.length;
    //const showAllOffers = props.showAllOffers;
    //const [showAllOffers, setShowAllOffers] = useState(false);
    const cellProps = /*showAllOffers ?*/ {
        rowSpan: rows,
    }// : {};
    function changeShowOffers(){
        //setShowAllOffers(!showAllOffers);
    }
    const fns = {
        selectOffer: (rn, api, on)=>console.log(rn+' '+api+' '+on)
    }
    const numTableCols = props.mainAttrs.length + props.offerAttrs.length;
    return(
        <>
        <tr>
        {props.data.offers.length > 0 && props.mainAttrs.map((attr, i) => {
            return <BOMAttributeRenderer key={i} value={props.data[attr.attribute]} custom={attr.custom} cellProps={cellProps} stockMode={props.stockMode}/>;
        })}
        {props.data.offers.length > 0 && props.offerAttrs.map((attr, i) => {
            return <APIAttributeRenderer key={i} value={props.data.offers[0][attr.attribute]} custom={attr.custom} 
            functions={fns} offerNum={0} api={props.data.distributor}
            stockMode={props.stockMode}/>
        })}
        </tr>
        {props.data.offers.length > 1 /*&& showAllOffers*/ && 
        [...Array(props.data.offers.length-1).keys()].map((i) => {
            const offerNum = i+1;
            return(
            <tr key={i}>
                {props.offerAttrs.map((attr, j) => {
                    return <APIAttributeRenderer key={j} value={props.data.offers[offerNum][attr.attribute]} custom={attr.custom} 
                    functions={fns} offerNum={offerNum} api={props.data.distributor}
                    stockMode={props.stockMode}/>
                })}
            </tr>
            );
        })}
        {/*props.data.offers.length > 1 && 
            <tr onClick={changeShowOffers}>
                <td colSpan={numTableCols} className='NoPadding'>
                <HoverOverlay placement='auto' 
                tooltip={showAllOffers ? 'Close offers' : 'Open offers'}>
                <HoverToggleSolidColour toggle={showAllOffers}/>
                </HoverOverlay>
                </td>
            </tr>
        */}
        </>
    );
}

function SinglePricesRenderer(props){
    //console.log(props.value);
    const table = <NewPricingTable pricing={props.value}/>;
    return(
        <SimplePopover popoverBody={table} trigger={['hover', 'focus']} placement='auto'>
            <div>
            {props.value[0].unit_price}
            </div>
        </SimplePopover>
    );
}

function SingleAPIHeader(){
    return(
        <thead className='TableHeading'>
        <tr>
            <th>

            </th>
        </tr>
        </thead>
    )
}