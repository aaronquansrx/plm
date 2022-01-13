import React, {useEffect, useState, useCallback} from 'react';
import update from 'immutability-helper';

import {PricingTable} from './Tables';
import {OutsideAlerter, OutsideAlerterVarFunction} from './Hooks';

import Accordion from 'react-bootstrap/Accordion'
import Table from 'react-bootstrap/Table';
import './../css/offer.css';

export function SimpleOffer(props){
    return (
        <Accordion>
            {props.offers.map((offer, i) => 
                <Accordion.Item key={i} eventKey={i}>
                    <Accordion.Header>Offer {i+1}</Accordion.Header>
                    <Accordion.Body>
                    <div className='Offer'>
                    <span>
                        {'Quantity Available: '+offer.Quantity.Available}
                    </span>
                    <span>
                    <Table bordered hover>
                    <thead>
                    <tr>
                    <th>Break Quantity</th><th>Price</th>
                    </tr>
                    </thead>
                    <tbody>
                    {offer.Pricing.map((bracket, j) => 
                        <tr key={j}>
                            <td>{bracket.BreakQuantity}</td>
                            <td>{bracket.UnitPrice}</td>
                        </tr>
                    )}
                    </tbody>
                    </Table>
                    </span>
                    <span>
                        {'Lead Time: '+offer.LeadTime}
                    </span>
                    </div>
                    </Accordion.Body>
                </Accordion.Item>
                
            )}
        </Accordion>
    );
}

export function SimpleOffer2(props){
    return (
        <>
        {props.offers.map((offer, i) => 
                <div className='Offer'>
                <span>
                    {'Quantity Available: '+offer.Quantity.Available}
                </span>
                <span>
                <Table bordered hover>
                <thead>
                <tr><th>Break Quantity</th><th>Price</th></tr>
                </thead>
                <tbody>
                {offer.Pricing.map((bracket, j) => 
                    <tr key={j}>
                        <td>{bracket.BreakQuantity}</td>
                        <td>{bracket.UnitPrice}</td>
                    </tr>
                )}
                </tbody>
                </Table>
                </span>
                <span>
                    {'Lead Time: '+offer.LeadTime}
                </span>
                </div>
            )}
        </>
    );
}
export function PartRow(props){
    const row = props.row;
    const maxOffers = row.original.maxOffers;
    const apiSubHeadings = props.apiSubHeadings;
    const [numShowOffers, setNumShowOffers] = useState(0);
    function handleShowOffersInc(inc){
        setNumShowOffers(numShowOffers+inc);
    }
    return(
        <>
        {[...Array(maxOffers)].map((e, i) => {
            //const offer = props.row;
            const rowProps = i === 0 ? {...row.getRowProps()} : {};
            return( 
            <OfferRow key={i} row={row} rowProps={rowProps} offerIndex={i}
            apiSubHeadings={apiSubHeadings} bomAttrsLength={props.bomAttrsLength}
            onShowPrice={handleShowOffersInc} numShowOffers={numShowOffers}
            onChangeQuantity={props.onChangeQuantity}/>
            );
        })}
        </>
    )
}
function OfferRow(props){
    const row = props.row;
    const rowData = row.original;
    const maxOffers = row.original.maxOffers;
    const [showOffers, setShowOffers] = useState(false);
    const [selectedQuantity, setSelectedQuantity] = useState(false);
    const [newQuantity, setNewQuantity] = useState(row.original.quantity);

    //console.log(quantityFunction);
    const rowProps = props.rowProps;
    const i = props.offerIndex;
    function isAPICell(n){
        return n >= props.bomAttrsLength;
    }
    function handleShowPrice(){
        const inc = showOffers ? -1 : 1;
        const opp = !showOffers;
        setShowOffers(opp);
        props.onShowPrice(inc);
    }
    function NoOffer(k){
        return <td key={k} colSpan={props.apiSubHeadings.length}>No Offer</td>;
    }
    function handleQuantityClick(){
        //if(newQuantity === null) setNewQuantity(row.original.quantity);
        setSelectedQuantity(true);
    }
    function handleOutsideQuantityClick(nq){
        return () => {
            props.onChangeQuantity(nq);
            setSelectedQuantity(false);
        }
    }
    function handleChangeQuantity(e){
        const nq = e.target.value;
        setNewQuantity(nq);
        //const s = handleOutsideQuantityClick(nq); //try usecallback
        //setQuantityFunction(s);
        //console.log(newQuantity);
    }
    return (
    <>
    <tr {...rowProps}>
        {row.cells.map((cell,c) => {
            const k = 'cell'+cell.column.id+'offer'+i;
            if(isAPICell(c)){
                if(cell.column.id in rowData){
                    const offers = rowData[cell.column.id].offers;
                    if(i < offers.length){
                        const offer = offers[i];
                        return(
                            <SubHeadingAttrs key={k} k={k} offer={offer} apiSubHeadings={props.apiSubHeadings} offer={offer}/>
                        );
                    }else{
                        return <td key={k} colSpan={props.apiSubHeadings.length}></td>;
                    }
                }else{
                    return NoOffer(k);
                }
            }else{
                if(cell.column.id === 'n'){
                    return(
                        <td key={k} {...cell.getCellProps()} className='Ver'>
                            <span>{i+1}</span>
                            <button onClick={handleShowPrice}>Prices</button>
                        </td>
                    );
                }else if(cell.column.id === 'quantity'){
                    if(i === 0){
                        return(
                            <td key={k} {...cell.getCellProps()} 
                            rowSpan={maxOffers+props.numShowOffers} 
                            onMouseDown={handleQuantityClick}>
                                {selectedQuantity ? 
                                <OutsideAlerterVarFunction f={handleOutsideQuantityClick} q={newQuantity}>
                                    <input autoFocus type='text' value={newQuantity} 
                                    onChange={handleChangeQuantity}/>
                                </OutsideAlerterVarFunction> :
                                cell.render('Cell')
                                }
                            </td>
                        );
                    }
                }else{
                    if(i === 0){
                        return(
                        <td key={k} {...cell.getCellProps()} 
                        rowSpan={maxOffers+props.numShowOffers}>
                            {cell.render('Cell')}
                        </td>
                        );
                    }
                }
            }
        })}
    </tr>
    {showOffers &&
    <tr>
        {row.cells.map((cell,c) => {
            if(isAPICell(c)){
                if(cell.column.id in rowData){
                    const offers = rowData[cell.column.id].offers;
                    if(i < offers.length){
                        const offer = offers[i];
                        return(
                            <td key={c} colSpan={props.apiSubHeadings.length}>
                                <PricingTable pricing={offer.pricing}/>
                            </td>
                        );
                    }else{
                        return <td key={c} colSpan={props.apiSubHeadings.length}></td>;
                    }
                }else{
                    return <td key={c} colSpan={props.apiSubHeadings.length}></td>;
                }
            }else if(cell.column.id === 'n'){
                return <td key={c} className='CellHeading'>Price</td>;
            }
        })}
    </tr>
    }
    </>
    )
}

function SubHeadingAttrs(props){
    const k = props.k;
    const offer = props.offer;
    return(
        <>
        {props.apiSubHeadings.map((heading, j) => 
            <td key={k+'heading'+j}>
                {heading.accessor in offer && offer[heading.accessor]}
            </td>
        )}
        </>
    );
}