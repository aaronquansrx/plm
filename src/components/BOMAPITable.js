import {useState, useEffect} from 'react';
import styled from 'styled-components';

import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

import {useClientUrl} from './../hooks/Urls';

import {SimplePopover, HoverOverlay} from './Tooltips';
import {PricingTable} from './Tables';
import {NumberInput} from './Forms';
import {ModalController} from './Modals';
import {MultiSelectRadioButtons} from './Forms';

import './../css/table.css';

const renderers = {
    'mpn': (p) => <MPNRenderer {...p}/>,
    'mpns': (p) => <MPNsRenderer {...p}/>,
    'quantities': (p) => <QuantitiesRenderer {...p}/>,
    'prices': (p) => <PricesRenderer {...p}/>,
    'activeApis': (p) => <ActiveApisRenderer {...p}/>
};

const defaultRenderer = (p) => <DefaultRenderer/>

export function BOMAPITableV2(props){
    const data = props.data;
    //const numRecords = props.data.length;

    const bomAttrs = props.bomAttrs;
    const apis = props.apis;
    const apiAttrs = props.apiAttrs;
    
    const apisHeader = apis;
    const apiAttrsAccessors = apiAttrs.map((attr) => attr.accessor);
    const apiAttrsHeaders = apiAttrs.map((attr) => attr.Header);
    const normalAttributes = props.bomAttrs.map((attr) => {
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
    });
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
            custom: (p) => <APIRenderer {...p}/>
        }
    });
    const attributeOrder = normalAttributes.concat(apiAttributes);
    function handleMainCheckBox(){

    }
    return (
        <div className='MainTable'>
        <Table>
            <BOMAPITableHeader checkbox={props.checkbox} bomAttrs={props.bomAttrs} 
            apis={props.apis} apiAttrs={props.apiAttrs}/>
            <tbody>
                {data.map((line, i) => 
                    <BOMRow key={i} rowNum={i} data={line} checkbox={props.checkbox} attributeOrder={attributeOrder}/>
                )}
            </tbody>
        </Table>
        </div>
    );
}

const HoverToggleSolidColour = styled.div`
    height: 15px;
    background: ${props => props.toggle ? 'blue' : 'green'};
    &:hover {
        background: red;
    }
`;

function BOMRow(props){
    //console.log(props.data);
    const [showAllOffers, setShowAllOffers] = useState(false);
    function changeShowOffers(){
        setShowAllOffers(!showAllOffers);
    }
    const firstRowCellProps = showAllOffers ? {rowSpan: props.data.maxOffers} : {};
    const numTableCols = props.attributeOrder.reduce((c, attr) => {
        if(attr.type == 'api'){
            return c+attr.subAttributes.length;
        }
        return c+1;
    }, 0);
    return(
        <>
        <tr>
            {props.checkbox &&
                <td><Checkbox/></td>
            }
            <BOMOffer offerNum={0} rowNum={props.rowNum} attributeOrder={props.attributeOrder} 
            data={props.data} cellProps={firstRowCellProps}/>
        </tr>
        {props.data.maxOffers > 1 && showAllOffers &&
        [...Array(props.data.maxOffers-1).keys()].map((i) => {
            const offerNum = i+1;
            return(
            <tr key={i}>       
                <BOMOffer offerNum={offerNum} rowNum={props.rowNum} attributeOrder={props.attributeOrder} data={props.data}/>
            </tr>
            );
        })}
        {props.data.maxOffers > 1 &&
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
            return (
                <BOMAttributeRenderer key={i} {...attr} cellProps={props.cellProps}
                value={props.data[attr.attribute]} offerNum={props.offerNum} rowNum={props.rowNum}/> 
            );
        })}
        </>
    );
}

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
    return(
        <>
        {props.value 
        ? ((props.value.offers.length > 0 && props.offerNum < props.value.offers.length)
        ? props.subAttributes.map((attr, i) => {
            return (
                <BOMAttributeRenderer key={i} value={props.value.offers[props.offerNum][attr.attribute]}
                 custom={attr.custom} type='normal'/>
            )
        })
        : <td colSpan={props.subAttributes.length}>{props.value.message}</td>)
        :  <td colSpan={props.subAttributes.length}>Waiting...</td>
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
    return(
        <td className='Select' onClick={handleMPNClick}>{mpn}</td>
    );
}

function MPNsRenderer(props){
    function handleClick(){
        props.functions.click();
    }
    return (
        <td {...props.cellProps} onClick={handleClick}>{props.value.current}</td>
    );
}

function QuantitiesRenderer(props){
    function handleBlur(newQuantity){
        props.functions.adjustQuantity(newQuantity, props.rowNum);
    }
    const quantPop = (
        <div>
            Single: {props.value.single}
            Multi: {props.value.multi}
        </div>
    );
    return (
        <td {...props.cellProps}>
            <SimplePopover popoverBody={quantPop} trigger={['hover', 'focus']} placement='auto'>
            <div><NumberInput onBlur={handleBlur} value={props.value.single}/></div>
            </SimplePopover>
        </td>
    );
}

function PricesRenderer(props){
    const pt = <PricingTable pricing={props.value.pricing} highlight={props.value.pricingIndex}/>;
    return (
        <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
            <td>{props.value.price}</td>
        </SimplePopover>
    );
}

function ActiveApisRenderer(props){
    const apisActivator = (
        <Button>Select</Button>
    );
    const apis = props.value.map((api) => {
        return {id: api, label: api};
    });
    const apisCheckboxes = (
        <MultiSelectRadioButtons options={apis}/>
    );
    return (
        <td>
        <ModalController activateModal={apisActivator} body={apisCheckboxes}/>
        </td>
    )
}

function DefaultRenderer(props){
    return(
        <td {...props.cellProps}>{props.value}</td>
    )
}