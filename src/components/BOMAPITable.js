import {useState, useEffect} from 'react';

import Table from 'react-bootstrap/Table';

import {useClientUrl} from '../hooks/Urls';

import './../css/table.css';

const renderers = {
    'mpn': (p) => <MPNRenderer {...p}/>,
    'mpns': (p) => <MPNsRenderer {...p}/>,
    'quantities': (p) => <QuantitiesRenderer {...p}/>
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
        return {
            attribute: attr.accessor,
            type: 'normal',
            custom: custom // custom renderer for cell?
        };
    });
    const apiAttributes = apis.map((api) => {
        const sa = apiAttrs.map((attr) => {
            //set custom renderers here
            return {
                attribute: attr.accessor,
                type: 'subattr',
                custom: null
            }
        });
        return {
            attribute: api.accessor,
            subAttributes: sa,
            type: 'api',
            custom: (p) => <APIRenderer {...p}/>
        }
    });

    const headerOrder = [];
    const attributeOrder = normalAttributes.concat(apiAttributes);
    //console.log(attributeOrder);
    function handleMainCheckBox(){

    }

    return (
        <Table>
            <BOMAPITableHeader checkbox={props.checkbox} bomAttrs={props.bomAttrs} 
            apis={props.apis} apiAttrs={props.apiAttrs}/>
            <tbody>
                {data.map((line, i) => 
                    <BOMRow key={i} data={line} checkbox={props.checkbox} attributeOrder={attributeOrder}/>
                )}
            </tbody>
        </Table>
    );
}

function BOMRow(props){
    //console.log(props.data);
    const [showAllOffers, setShowAllOffers] = useState(false);
    return(
        <>
        <tr>
            {props.checkbox &&
                <td><Checkbox/></td>
            }
            <BOMOffer offerNum={0} attributeOrder={props.attributeOrder} data={props.data}/>
        </tr>
        {props.data.maxOffers > 1 && showAllOffers &&
        [...Array(props.data.maxOffers-1).keys()].map((i) => {
            const offerNum = i+1;
            return(
            <tr>       
                <BOMOffer key={i} offerNum={offerNum} attributeOrder={props.attributeOrder} data={props.data}/>
            </tr>
            );
        })
        }
        </>
        
    );
}

function BOMOffer(props){
    return (
        <>
        {props.attributeOrder.map((attr, i) => {
            return (
                <BOMAttributeRenderer key={i} {...attr} value={props.data[attr.attribute]} offerNum={props.offerNum}/> 
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
        ? ((props.value.offers.length > 0) 
        ? props.subAttributes.map((attr, i) => {
            return (
                <BOMAttributeRenderer key={i} value={props.value.offers[props.offerNum][attr.attribute]} type='normal'/>
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
    <thead>
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
    return (
        <td>{props.value.current}</td>
    );
}

function QuantitiesRenderer(props){
    return (
        <td>{props.value.single}</td>
    );
}


function DefaultRenderer(props){
    return(
        <td>{props.value}</td>
    )
}