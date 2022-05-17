import {useState, useEffect} from 'react';

import Table from 'react-bootstrap/Table';

import {NumberInput, SelectorForm} from './Forms';
import {HoverOverlayTableCell, SimplePopover, HoverOverlay} from './Tooltips';
import {PricingTable} from './Tables';

import {useClientUrl} from '../hooks/Urls';

import './../css/table.css';

import styled from 'styled-components';
import { set } from 'lodash';
import { propTypes } from 'react-bootstrap/esm/Image';

const renderers = {
    'mpn': (p) => <MPNRenderer {...p}/>,
    'mpns': (p) => <MPNsRenderer {...p}/>,
    'initialQuantity': (p) => <InitialQuantityRenderer {...p}/>,
    'display_quantity': (p) => <QuantityRenderer {...p}/>,
    'quantities': (p) => <QuantitiesRenderer {...p}/>,
};

const apiAttrRenderers = {
    'prices': (p) => <PriceRenderer {...p}/>
};

const defaultRenderer = (p) => <DefaultRenderer/>

export function BOMAPITableV2(props){
    //console.log('changed');
    const data = props.data;
    //const numRecords = props.data.length;

    const bomAttrs = props.bomAttrs;
    const apis = props.apis;
    const apiAttrs = props.apiAttrs;
    
    //const apisHeader = apis;
    //const apiAttrsAccessors = apiAttrs.map((attr) => attr.accessor);
    //const apiAttrsHeaders = apiAttrs.map((attr) => attr.Header);
    const normalAttributes = bomAttrs.map((attr) => {
        const custom = (attr.accessor in renderers)
        ? renderers[attr.accessor] : null;
        return {
            attribute: attr.accessor,
            type: 'normal',
            custom: custom, // custom renderer for cell?
            functions: props.functions[attr.accessor]
        };
    });
    const apiAttributes = apis.map((api) => {
        const sa = apiAttrs.map((attr) => {
            const custom = (attr.accessor in apiAttrRenderers)
            ? apiAttrRenderers[attr.accessor] : null;
            return {
                attribute: attr.accessor,
                type: 'subattr',
                custom: custom,
                functions: props.functions[attr.accessor]
            }
        });
        return {
            attribute: api.accessor,
            subAttributes: sa,
            type: 'api',
            custom: (p) => <APIRenderer {...p}/>
        }
    });

    //const headerOrder = [];
    const attributeOrder = normalAttributes.concat(apiAttributes);
    //console.log(attributeOrder);
    function handleMainCheckBox(){

    }

    const fullColSpan = bomAttrs.length + (apis.length*apiAttrs.length) + 1; //+1 for checkbox

    return (
        <div className='MainTable'>
        <Table>
            <BOMAPITableHeader checkbox={props.checkbox} bomAttrs={props.bomAttrs} 
            apis={props.apis} apiAttrs={props.apiAttrs}/>
            <tbody>
                {data.map((line, i) => 
                    <BOMRow key={i} rowNum={i} data={line} checkbox={props.checkbox} 
                    attributeOrder={attributeOrder} fullColSpan={fullColSpan}
                    //highlight={props.lowestPriceOffers[i]}
                    apisAllCalled={props.apisAllCalled}
                    />
                )}
            </tbody>
        </Table>
        </div>
    );
}

const Fill = styled.div`
background: ${props => props.colour ? props.colour : 'blue'};
width: ${props => props.width ? props.width : '100%'};
height: ${props => props.height ? props.height : '100%'};

&:hover {
    background: ${props => props.hoverColour ? props.hoverColour : 'red'}
}

`;
const DownDiv = styled.div`
height: 15px;
background: red;
clip-path: polygon(100% 0, 50% 100%, 0 0);
`;

function BOMRow(props){
    //console.log(props.data);
    const [showOffers, setShowOffers] = useState(false);

    function handleToggleOffers(){
        setShowOffers(!showOffers);
    }
    const maxOffers = props.data.maxOffers;
    const firstCellProps = {rowSpan: showOffers?maxOffers:1}; // filter cell props for attributes and apis (they use differing) maybe call it another name
    //console.log(props.highlight);
    function highlightValue(i){
        if(props.highlight){
            return props.highlight.offerNum == i ? props.highlight.api : null;
        }
        return null;
    }
    return(
        <>
        <tr>
            {props.checkbox && 
            <td rowSpan={showOffers?maxOffers:1}><Checkbox/></td>
            }
            <BOMOffer offerNum={0} rowNum={props.rowNum} attributeOrder={props.attributeOrder} 
            data={props.data} cellProps={firstCellProps} 
            highlight={highlightValue(0)} apisAllCalled={props.apisAllCalled}/>
        </tr>
        {showOffers &&

        [...Array(maxOffers-1)].map((e, i) => {
            const n = i+1;
            return(
                <tr key={i}>
                <BOMOffer offerNum={n} rowNum={props.rowNum} attributeOrder={props.attributeOrder} data={props.data}
                highlight={highlightValue(n)} apisAllCalled={props.apisAllCalled}/>
                </tr>
            );
        })}
        {maxOffers > 1 &&
        <tr>
            <td className='NoPadding' colSpan={props.fullColSpan} onClick={handleToggleOffers}>
                <HoverOverlay placement='auto' tooltip={showOffers ? 'Hide Offers' : 'Show Offers'}>
                    <Fill colour={showOffers ? 'blue' : 'green'} height='15px'/>
                </HoverOverlay>
            </td>
        </tr>
        }
        </>
    );
}

//put first offer and other offers on one line
function BOMOffer(props){
    const attributes = props.offerNum == 0 
    ? props.attributeOrder
    : props.attributeOrder.reduce((arr, attr) => {
        if(attr.type=='api'){
            arr.push(attr);
        }
        return arr;
    }, []);
    //const firstCellProps = props.offerNum == 0 ? {rowSpan: showOffers?maxOffers:1} : {};
    return (
        <>
        {attributes.map((attr, i) => {
            //if(attr.attribute ==)
            return (
                <BOMAttributeRenderer key={i} rowNum={props.rowNum} offer={props.offerNum} {...attr} 
                value={props.data[attr.attribute]} cellProps={props.cellProps} 
                highlight={attr.attribute == props.highlight} 
                apisAllCalled={props.apisAllCalled}/> 
            );
        })}
        </>
    );
}
/*
function BOMFirstOffer(props){
    return(
    <>
    {props.attributeOrder.map((attr, i) => {
        //if(attr.attribute ==)
        return (
            <BOMAttributeRenderer key={i} offer={0} {...attr} value={props.data[attr.attribute]} cellProps={props.cellProps} 
            highlight={attr.attribute == props.highlight} apisAllCalled={props.apisAllCalled}/> 
        );
    })}
    </>
    );
}

function BOMOtherOffer(props){
    const attributes = props.attributeOrder.reduce((arr, attr) => {
        if(attr.type=='api'){
            arr.push(attr);
        }
        return arr;
    }, []);
    return(
        <>
        {attributes.map((attr, i) => {
            return (
                <BOMAttributeRenderer key={i} offer={props.offerNum} {...attr} value={props.data[attr.attribute]}
                highlight={attr.attribute == props.highlight} apisAllCalled={props.apisAllCalled}/> 
            );
        })}
        </>
        );
}
*/
function BOMAttributeRenderer(props){
    //console.log(props.subAttributes);
    /*
    const fromType = {
        api: <APIRenderer {...props}/>,
        normal: <td>{props.value}</td>
    }
    const renderer = props.custom({...props});
    */
    //console.log(props);
    return(
        <>
        {props.custom ? props.custom({...props}) : <DefaultRenderer {...props}/>}
        </>
    );
}

function APIRenderer(props){
    //console.log(props);
    //const hasOffers = props.value && props.value.offers.length > 0;
    const n = props.offer ? props.offer : 0;
    //console.log(props);
    const cellProps = {
        //...props.cellProps, //cell props only used for bom attributes (this will give rowspan to first offer (not wanted))
        className: props.highlight ? 'BestPriceOffer':'NormalOffer'
    };
    return(
        <>
        {props.value 
        ? ((props.value.offers.length > n) 
        ? props.subAttributes.map((attr, i) => {
            //console.log(attr);
            return (
                <BOMAttributeRenderer key={i} cellProps={cellProps} value={props.value.offers[n][attr.attribute]} {...attr}/>
            )
        })
        : <td colSpan={props.subAttributes.length}>{props.value.message}</td>)
        : <td colSpan={props.subAttributes.length}>Waiting...</td>
        }
        </>
    );
}

//vertical-align to center header elements for rowspan=2

//checkbox on first col
function BOMAPITableHeader(props){
    const numApiAttrs = props.apiAttrs.length;
    return(
    <thead className='TableHeading'>
        <tr>
        {props.checkbox && 
        <th rowSpan='2'>
            <Checkbox/>
        </th>
        }
        {props.bomAttrs.map((attr,i) => 
            <th key={i} rowSpan='2'>{attr.Header}</th>
        )}
        {props.apis.map((api, i) =>
            <th key={i} colSpan={numApiAttrs}>{api.Header}</th>
        )}
        </tr>
        <tr>
        {props.apis.map((api, i) => 
            props.apiAttrs.map((attr, j) => 
                <th key={i*numApiAttrs+j}>{attr.Header}</th>
            )
        )}
        </tr>
    </thead>
    );
}

function Checkbox(){
    return(
    <input className="form-check-input" type="checkbox"/>
    );
}

function MPNRenderer(props){
    const clientUrl = useClientUrl();
    const mpn = props.value;
    function handleMPNClick(){
        window.open(clientUrl+'partdetails/'+mpn, '_blank');
    }
    const cellProps = {
        className:'Select', ...props.cellProps
    }
    //className='Select' onClick={handleMPNClick}
    return(
        <td {...props.cellProps}>
            <HoverOverlay tooltip='Open part details'>
            <div className='Select' onClick={handleMPNClick}>
                {mpn}
            </div>
            </HoverOverlay>
        </td>
        /*
        <HoverOverlayTableCell tooltip='Open part details' cellProps={cellProps}>
        {mpn}
        </HoverOverlayTableCell>
        */
    );
}

function MPNsRenderer(props){
    const [showSelector, setShowSelector] = useState(false);
    const clientUrl = useClientUrl();
    const mpn = props.value.current;
    function handleMPNClick(e){
        if(props.apisAllCalled){
        }
        //console.log(e.shiftKey);
        if(e.shiftKey){
            window.open(clientUrl+'partdetails/'+mpn, '_blank');
        }else{
            if(props.value.options.length > 1){
                setShowSelector(true);
            }
        }
    }
    function handleSelectMpn(e){
        if(props.apisAllCalled){
        }
    }
    function handleBlurMpn(e){
        setShowSelector(false);
        console.log(props.apisAllCalled);
        if(props.apisAllCalled){
            //props.value.f(mpn, e.target.value);
            props.functions.changeOption(mpn, e.target.value);
        }
    }
    const tooltipText = showSelector ? 'Select MPN options' : 'Open Options(click) Open part details (shift+click)'
    return(
    <td {...props.cellProps}>
        <HoverOverlay tooltip={tooltipText}>
        <div className='Select' onClick={handleMPNClick}>
            {showSelector
            ? <SelectorForm onBlur={handleBlurMpn} options={props.value.options}/> 
            : mpn
            }
            {/*<SelectorForm onBlur={handleBlurMpn} 
            onSelect={handleSelectMpn} options={props.value.options}/>*/}
        </div>
        </HoverOverlay>
    </td> 
    );
}

function QuantityRenderer(props){
    //const 
    //have quantities under quantity obj
    return(
        <td {...props.cellProps}>{props.value}</td>
    );
}

function QuantitiesRenderer(props){
    function handleBlur(v){
        if(props.apisAllCalled){
            props.functions.changeQuantity(v, props.rowNum);
        }
    }
    const quantityViewer = (
        <div>
            <div>
                Single: {props.value.single}
            </div>
            <div>
                Multi: {props.value.multi}
            </div>
        </div>
    );
    return(
        <td {...props.cellProps}>
            <SimplePopover trigger={['hover','focus']} placement='auto' body={quantityViewer}>
            <div>
            {props.value.display !== '' ?
            <NumberInput onBlur={handleBlur} value={props.value.single}/>
            : <div className='QuantitiesBox'></div>
            }
            </div>
            </SimplePopover>
        </td>
    )
}

function InitialQuantityRenderer(props){
    //const 
    //have quantities under quantity obj
    function handleBlur(v){
        console.log(v);
    }
    return(
        <td {...props.cellProps}><NumberInput onBlur={handleBlur} value={props.value}/></td>
    );
}

function PriceRenderer(props){
    
    //const [isHovered, setIsHovered] = useState(false);
    //have price also include the table
    //console.log(props.value);
    const priceTable = (
        <PricingTable pricing={props.value.table} highlightIndex={props.value.tableIndex}/>
    );
    //console.log(props.value);
    return(
    // use tooltip to show pricing table 
    <td {...props.cellProps}>
        <SimplePopover trigger={['hover','focus']} placement='auto' body={priceTable}>
            <div>{props.value.price}</div>
        </SimplePopover>
    </td>
    );
}


function DefaultRenderer(props){
    return(
        <td {...props.cellProps}>{props.value}</td>
    );
}