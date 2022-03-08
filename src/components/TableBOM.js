import {useState, useEffect} from 'react';

import Table from 'react-bootstrap/Table';

const renderers = {
    'mpn': (p) => <MPNRenderer/>,
    'quantity': (p) => <QuantityRenderer/>,
    //'default': 
};


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
        return {
            attribute: attr.accessor,
            type: 'normal',
            custom: null // custom renderer for cell?
        };
    });
    const apiAttributes = apis.map((api) => {
        const sa = apiAttrs.map((attr) => {
            return {
                attribute: attr.accessor,
                type: 'subattr',
                custom: null
            }
        });
        return {
            attribute: api.accessor,
            subAttributes: sa,
            type: 'api'
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
                {data.map((line) => 
                    <BOMRow data={line} checkbox={props.checkbox} attributeOrder={attributeOrder}/>
                )}
            </tbody>
        </Table>
    );
}

function BOMRow(props){
    //console.log(props.data);
    return(
        <tr>
            <td><Checkbox/></td>
            {props.attributeOrder.map((attr) => {
                return (
                    <BOMAttributeRenderer {...attr} value={props.data[attr.attribute]}/> 
                );
            })}
        </tr>
    );
}

function BOMAttributeRenderer(props){
    //console.log(props.subAttributes);
    const fromType = {
        api: <APIRenderer {...props}/>,
        normal: <td>{props.value}</td>
    }
    return(
        <>
        {fromType[props.type]}
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
            <td key={i}>
                <BOMAttributeRenderer value={props.value.offers[0][attr.attribute]} type='normal'/>
            </td>
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
    
}

function QuantityRenderer(props){

}