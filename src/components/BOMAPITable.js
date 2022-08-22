import {useState, useEffect} from 'react';
import styled from 'styled-components';

import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

import {useClientUrl} from './../hooks/Urls';

import {SimplePopover, HoverOverlay} from './Tooltips';
import {PricingTable} from './Tables';
import {ModalController, TemplateModal} from './Modals';
import {MultiSelectRadioButtons, OutsideControlCheckbox, 
    AddRemoveEditSelectorForm,
    NumberInput, SelectorForm} from './Forms';
import {PageInterface} from './Pagination';
import {usePaging} from './../hooks/Paging';

import {stockString} from './../scripts/AlgorithmVariable';

import { slice } from 'lodash';

import lockIcon from './../lock-128.png';

import './../css/table.css';
import './../css/offer.css';
import './../css/main.css';

const isProduction = process.env.NODE_ENV === 'production';

const renderers = {
    'mpn': (p) => <MPNRenderer {...p}/>,
    'mpns': (p) => <MPNsRenderer {...p}/>,
    'quantities': (p) => <QuantitiesRenderer {...p}/>,
    'prices': (p) => <PricesRenderer {...p}/>,
    'activeApis': (p) => <ActiveApisRenderer {...p}/>,
    'adjustedQuantity': (p) => <AdjustedQuantityRenderer {...p}/>,
    'excessPrice': (p) => <ExcessPriceRenderer {...p}/>,
    'excessQuantity': (p) => <AdjustedQuantityRenderer {...p}/>,
    'totalPrice': (p) => <TotalPriceRenderer {...p}/>,
    'octopart': (p) => <OctopartRenderer {...p}/>
};


const octoRenderers = {
    'prices': (p) => <OctoPricesRenderer {...p}/>,
}

const headerRenderers = {
    'activeApis': (p) => <ActiveApisHeaderRenderer {...p}/>,
    'leadtime': (p) => <LeadTimeHeaderRenderer {...p}/>,
    'adjustedQuantity': (p) => <AdjustedQuantityHeaderRenderer {...p}/>
};

const defaultRenderer = (p) => <DefaultRenderer/>

function smartAttr(type, funs, vars, rendererList){
    return function(attr){
        const custom = (attr.accessor in rendererList)
        ? rendererList[attr.accessor] : null;
        const functions = (attr.accessor in funs)
        ? funs[attr.accessor] : null;
        const vr = (attr.accessor in vars) ? vars[attr.accessor] : {};
        return {
            attribute: attr.accessor,
            header: attr.Header,
            type: type,
            custom: custom, // custom renderer for cell?
            vars: vr,
            functions: functions
        };
    }
}

export function BOMAPITableV2(props){
    const bomAttrs = props.bomAttrs;
    const apis = props.apis; //apis to display
    const allApis = props.allApis; // all possible apis
    const apiAttrs = props.apiAttrs;
    const apisToHeader = allApis.reduce((obj, api) => {
        obj[api.accessor] = api.Header;
        return obj;
    }, {});
    const normalAttributes = bomAttrs.map(smartAttr('normal', props.functions, {}, renderers));
    
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
        {Header: 'Total Price', accessor: 'totalPrice'}
    ]);
    const extApiAttrs = extendedApiAttrs.map(smartAttr('best', props.functions, {}, renderers));
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
                    <BOMRow key={i} highlightMode={props.highlightMode} rowNum={line.rowNum} 
                    data={line} hasLineLocks={props.hasLineLocks} mpn={line.mpns.current}
                    attributeOrder={attributeOrder} functionLock={props.functionLock} offerFunctions={props.functions.offer}
                    onLineLock={props.onLineLock} bestAttributeOrder={bestAttributeOrder}
                    tableState={tbs} apisToHeader={apisToHeader} apis={apis} allApis={allApis}/>
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
        {Header: 'Total Price', accessor: 'total_price'}
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
    function changeShowOffers(){
        setShowAllOffers(!showAllOffers);
    }
    const maxOffers = getMaxOffers();
    //console.log(maxOffers);
    const firstRowCellProps = showAllOffers && maxOffers > 0 && props.tableState ? {rowSpan: maxOffers} : {rowSpan: 1};
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
        if(props.apis.length === props.allApis.length) return props.data.maxOffers;
        //console.log('t');
        return props.apis.reduce((max, api) => {
            if(props.data[api.accessor].offers.length > max) return props.data[api.accessor].offers.length;
            return max;
        }, 0);
    }
    const lockTTip = props.data.lineLock ? 'Unlock Line' : 'Lock Line';
    const attributeOrder = props.tableState ? props.attributeOrder : props.functionLock ? props.attributeOrder : props.bestAttributeOrder;
    const stockMode = stockString(props.highlightMode.stock);
    const hl = props.data.highlights[stockMode][props.highlightMode.best];
    const bestOffer = hl ? props.data[hl.api].offers[hl.offerNum] : null;
    const data = props.tableState ? props.data : {
        ...props.data,
        ...bestOffer,
        distributor: hl ? props.apisToHeader[hl.api] : ''
    };
    //console.log(props.bestAttributeOrder);
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
            <BOMOffer offerNum={0} rowNum={props.rowNum} attributeOrder={attributeOrder} 
            data={data} cellProps={firstRowCellProps} highlightMode={props.highlightMode} 
            lock={props.data.lineLock} functionLock={props.functionLock} mpn={props.mpn} offerFunctions={props.offerFunctions}/>
            }
        </tr>
        {maxOffers > 1 && showAllOffers && props.tableState && 
        [...Array(maxOffers-1).keys()].map((i) => {
            const offerNum = i+1;
            return(
            <tr key={i}>       
                <BOMOffer offerNum={offerNum} rowNum={props.rowNum} attributeOrder={props.attributeOrder} 
                data={props.data} highlightMode={props.highlightMode} mpn={props.mpn} offerFunctions={props.offerFunctions}/>
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
            const stockMode = props.highlightMode.stock ? 'stock' : 'noStock';
            const specAttrs = attr.type === 'api' 
            ? {
                highlight: props.data.highlights[stockMode],
                api: attr.attribute,
                highlightMode: props.highlightMode.best,
                mpns: props.data.mpns
            } 
            : {};
            //console.log(props.data.highlights[stockMode]);
            const offerNum = attr.type === 'api' && props.data[attr.attribute]
            ? props.data[attr.attribute].offerOrder[stockMode][props.highlightMode.best][props.offerNum] 
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
    return(
        <>
        {props.custom ? props.custom({...props}) : <DefaultRenderer {...props}/>}
        </>
    );
}

function APIAttributeRenderer(props){
    //console.log(props.custom);
    //console.log(props.functions);
    function handleClick(){
        props.functions.selectOffer(props.rowNum, props.api, props.offerNum);
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
    const hasHighlight = Object.entries(props.highlight).reduce((obj, [k, v]) => {
        if(v !== null){
            obj[k] = v.offerNum === props.offerNum && v.api === props.api;
        }
        return obj;
    }, {});
    let cn = (props.highlightMode in hasHighlight) 
    ? (hasHighlight[props.highlightMode] ? 'HighlightedCell' : 'NormalCell') 
    : 'NormalCell';
    if(props.value && props.value.offers.length > 0 && props.offerNum < props.value.offers.length){
        if(props.value.offers[props.offerNum].selected){
            cn = 'SelectedCell';
        }
    }
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
                stockMode={props.stockMode} highlightMode={props.highlightMode}/>
            */
            return (
                <APIAttributeRenderer key={i} value={props.value.offers[props.offerNum][attr.attribute]}
                custom={attr.custom} type='apiAttr' offerNum={props.offerNum} rowNum={props.rowNum} cellProps={cellProps} api={props.api}
                stockMode={props.stockMode} highlightMode={props.highlightMode} functions={props.offerFunctions}/>
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
        <td className='Select' onClick={handleMPNClick}>{mpn}</td>
    );
}

function MPNsRenderer(props){
    const [editSelector, setEditSelector] = useState(false);
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
    function handleSelectMpn(e){

    }
    function handleEditMpn(newMpn){
        setEditSelector(false);
        //console.log(mpn+' : '+newMpn);
        props.functions.editOption(props.rowNum, mpn, newMpn);
    }
    function handleBlurMpn(e){
        console.log(props.functionLock);
        if(!props.lock && !props.functionLock){
            if(e.target.value === 'addNew'){
                //props.functions
                props.functions.addOption(props.rowNum);
                setEditSelector(true);
                //props.functions.changeOption(props.rowNum, '');
            }else{
                props.functions.changeOption(props.rowNum, e.target.value);
            }
    }
    }
    const showSelector = props.value.options.length > 1;
    const tooltipText = 'Select MPN options | shift-click to edit | ctrl-click for details | alt-click delete current';
    return(
    <td {...props.cellProps}>
        <HoverOverlay tooltip={tooltipText}>
        <div className='Select' onClick={handleMPNClick}>
            {/*showSelector
            ? <AddRemoveEditSelectorForm onSelect={handleBlurMpn} options={props.value.options}/> 
            : mpn
            */}
            <AddRemoveEditSelectorForm edit={editSelector} onSelect={handleBlurMpn} 
            options={props.value.options} selected={mpn} onEdit={handleEditMpn} disabled={props.lock || props.functionLock}/> 
        </div>
        </HoverOverlay>
    </td> 
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
        <td {...props.cellProps}>
            <SimplePopover popoverBody={quantPop} trigger={['hover', 'focus']} placement='auto'>
            <div><NumberInput onBlur={handleBlur} value={props.value.single} disabled={props.lock || props.functionLock}/></div>
            </SimplePopover>
        </td>
    );
}

function priceDisplay(price){
    return parseFloat(price.toFixed(4));
}

function PricesRenderer(props){
    const pt = props.value ? 
    <>
    <PricingTable pricing={props.value.pricing} highlight={props.value.pricingIndex[props.stockMode]}/>
    </> : <></>;
    //<SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'></SimplePopover>
    return (
            <>
            <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
                <div>{props.value && priceDisplay(props.value.price[props.stockMode])}</div>
            </SimplePopover>
            </>
    );
}

function TotalPriceRenderer(props){
    return (
    <>
    {/*<td {...props.cellProps}>}*/}
        {props.value && priceDisplay(props.value[props.stockMode])}
    {/*</td>*/}
    </>
    );
}

function AdjustedQuantityRenderer(props){
    //console.log(props);
    const display = props.value ? props.value[props.stockMode] : '-';
    //<td {...props.cellProps}></td>//
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
        <td {...props.cellProps}>
        <Button disabled={props.lock} onClick={handleOpenModal}>Apis</Button>
        <TemplateModal show={apiModal} title='Select APIs' body={apisCheckboxes} footer={footer} onClose={handleCloseModal}/>
        {/*<ModalController hide={showModal} activateModal={apisActivator} title='Select APIs' 
        body={apisCheckboxes} footer={footer}/>*/}
        </td>
    )
}

function OctopartRenderer(props){
    //console.log(props.functions);
    const [showModal, setShowModal] = useState(0);
    const [octoRequested, setOctoRequested] = useState(false);
    const [modalOn, setModalOn] = useState(false);
    const activator = (
        <Button onClick={() => setModalOn(true)} disabled={props.lock}>Request</Button>
    );
    function onClose(){
        setShowModal(showModal+1);
        setModalOn(false)
    };
    const [octoData, setOctoData] = useState([]);
    useEffect(() => {
        if(modalOn && !octoRequested){
            props.functions.requestOctopart(props.rowNum, callbackOctoRequest);
            console.log('req octo');
            setOctoRequested(true);
        }
    }, [modalOn]);
    function callbackOctoRequest(od){
        setOctoData(od);
    }
    /*
    function onOctopart(){
        props.functions.requestOctopart(props.rowNum, callbackOctoRequest);
    }*/
    const title = 'Octopart Offers for '+props.mpn;
    const body = (
        <>
        {/*!isProduction && <Button onClick={onOctopart}>Octopart</Button>*/}
        {octoData.length > 0 && !isProduction && <OctopartTable data={octoData}/>}
        </>
    );
    const footer = <Button variant='secondary' onClick={onClose}>Close</Button>
    return (
        <td {...props.cellProps}>
            <ModalController modalClass='OctopartOffers' hide={showModal} activateModal={activator} title={title} body={body} footer={footer}/>
        </td>
    );
}

function AdjustedQuantityHeaderRenderer(props){
    return (
        <th {...props.headerProps}>
            <HoverOverlay tooltip='Adjusted Quantity' placement='auto'>{props.header}</HoverOverlay>
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
            <Button disabled={props.lock} onClick={handleOpenModal}>Apis</Button>
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
        <td {...props.cellProps}>{props.value}</td>
    )
}

function OctopartTable(props){
    const octoHeaders = [{Header: 'Distributor', accessor: 'distributor'}];
    const offerHeaders = [
        {Header: 'Stock', accessor: 'available'},
        {Header: 'MOQ', accessor: 'moq'},
        {Header: 'Lead Time', accessor: 'leadtime'},
        {Header: 'Price', accessor: 'prices'},
        {Header: 'SPQ', accessor: 'spq'},
        {Header: 'Packaging', accessor: 'packaging'}
    ];
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
                    <OctopartRow key={i} data={dataObj} octoAttrs={octoAttributes} offerAttrs={offerAttributes}/>
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
    return(
        <>
        <tr>
        {props.data.offers.length > 0 && props.octoAttrs.map((attr, i) => {
            return <BOMAttributeRenderer key={i} value={props.data[attr.attribute]} custom={attr.custom} cellProps={octoCellProps}/>;
        })}
        {props.data.offers.length > 0 && props.offerAttrs.map((attr, i) => {
            return <BOMAttributeRenderer key={i} value={props.data.offers[0][attr.attribute]} custom={attr.custom}/>
        })}
        </tr>
        {props.data.offers.length > 1 && showAllOffers && 
        [...Array(props.data.offers.length-1).keys()].map((i) => {
            const offerNum = i+1;
            return(
            <tr key={i}>
                {props.offerAttrs.map((attr, j) => {
                    return <BOMAttributeRenderer key={j} value={props.data.offers[offerNum][attr.attribute]} custom={attr.custom}/>
                })}
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

function OctoPricesRenderer(props){
    const pt = props.value ? <NewPricingTable pricing={props.value.pricing} highlight={props.value.pricingIndex}/> : <></>;
    return (
        <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
            <td {...props.cellProps}>{props.value && props.value.price}</td>
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