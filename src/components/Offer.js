import {useState /*,useEffect, useCallback*/} from 'react';
import update from 'immutability-helper';

import {PricingTable} from './Tables';
//import {OutsideAlerter, OutsideAlerterVarFunction} from './Hooks';
 
import Button from 'react-bootstrap/Button';
import Accordion from 'react-bootstrap/Accordion';
import Table from 'react-bootstrap/Table';

import {HoverOverlay} from './Tooltips';
import './../css/offer.css';

export function SimpleLabel(props){
    return(
        <div>
            <span>{props.label}</span>
            <span>{props.value}</span>
        </div>
    );
}

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

export function EmptyOffer(props){
    const row = props.row;
    const rowData = row.original;
    //console.log(row);
    function isAPICell(n){
        return n >= props.bomAttrsLength;
    }
    function NoOffer(k){
        return <td key={k} colSpan={props.apiSubHeadings.length}>
            {props.finished ? 'No Offers' : 'Waiting...'}
        </td>;
    }
    const [newQuantity, setNewQuantity] = useState(rowData.display_quantity);
    function handleOutsideQuantityClick(nq){
        return () => {
            props.onChangeQuantity(nq);
        }
    }
    function handleChangeQuantity(e){
        const nq = e.target.value;
        setNewQuantity(nq);
    }
    return(
    <tr {...row.getRowProps()}>
        {row.cells.map((cell,i) => {
            const k = i;
            if(isAPICell(i)){
                return NoOffer(k);
            }else{
                //displayQuantity
                if(cell.column.id === 'display_quantity' && rowData.display_quantity !== ''){
                    return(
                    <td key={k} {...cell.getCellProps()} /*onMouseDown={handleQuantityClick}*/>
                        <input className='TextBox' type='text' value={newQuantity} 
                        onChange={handleChangeQuantity} onBlur={handleOutsideQuantityClick(newQuantity)}/>
                    </td>
                    );
                }else{
                    return (
                        <td key={k} {...cell.getCellProps()}>
                            {cell.render('Cell')}
                        </td>
                    );
                }
            }
        })}
    </tr>
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
    //console.log(row);
    return(
        <>
        {[...Array(maxOffers)].map((e, i) => {
            //const offer = props.row;
            const highlight = props.highlight && props.highlight.offerNum === i ? props.highlight.api : null;
            const rowProps = i === 0 ? {...row.getRowProps()} : {};
            return( 
            <OfferRow key={i} row={row} rowProps={rowProps} offerIndex={i}
            apiSubHeadings={apiSubHeadings} bomAttrsLength={props.bomAttrsLength}
            onShowPrice={handleShowOffersInc} numShowOffers={numShowOffers}
            onChangeQuantity={props.onChangeQuantity}
            highlight={highlight}/>
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
    //const [selectedQuantity, setSelectedQuantity] = useState(false);
    const [newQuantity, setNewQuantity] = useState(row.original.display_quantity);
    const [showPartDetails, setShowPartDetails] = useState(false);
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
    function handleQuantitySubmit(nq){
        return () => {
            props.onChangeQuantity(nq);
            //setSelectedQuantity(false);
        }
    }
    function handleChangeQuantity(e){
        const nq = e.target.value;
        setNewQuantity(nq);
        //const s = handleOutsideQuantityClick(nq); //try usecallback
        //setQuantityFunction(s);
        //console.log(newQuantity);
    }
    function handleMpnClick(mpn){
        return function(){
            window.open('/partdetails/'+mpn, '_blank');
        };
    }
    return (
    <>
    <tr {...rowProps}>
        {row.cells.map((cell,c) => {
            const k = 'cell'+cell.column.id+'offer'+i;
            if(isAPICell(c)){
                if(cell.column.id in rowData){
                    const api = cell.column.id;
                    const highlight = props.highlight ? props.highlight === api : false;
                    //const highlight = api == 'digikey';
                    const offers = rowData[api].offers;
                    if(i < offers.length){
                        const offer = offers[i];
                        return(
                            <SubHeadingAttrs key={k} k={k} offer={offer} apiSubHeadings={props.apiSubHeadings} 
                            offer={offer} highlight={highlight}/>
                        );
                    }else{
                        return <td key={k} colSpan={props.apiSubHeadings.length}>{i === 0 && rowData[api].message}</td>;
                    }
                }else{
                    return NoOffer(k);
                    //return <td key={k} colSpan={props.apiSubHeadings.length}>Waiting...</td>;
                }
            }else{
                if(cell.column.id === 'n'){
                    return(
                        <td key={k} {...cell.getCellProps()} className='Ver'>
                            <span>{i+1}</span>
                            <HoverOverlay tooltip={showOffers ? 'Hide Offers' : 'Show Offers'}>
                            <Button onClick={handleShowPrice}>Prices</Button>
                            </HoverOverlay>
                        </td>
                    );
                }else if(cell.column.id === 'display_quantity' && newQuantity !== ''){
                    if(i === 0){
                        return(
                            <td key={k} {...cell.getCellProps()} 
                            rowSpan={maxOffers+props.numShowOffers}>
                                <input className='TextBox' type='text' value={newQuantity} 
                                    onChange={handleChangeQuantity} onBlur={handleQuantitySubmit(newQuantity)}/>
                            </td>
                        );
                    }
                }else if(cell.column.id === 'mpn'){
                    if(i === 0){
                        const mpn = cell.value;
                        return(
                            <td key={k} {...cell.getCellProps()} rowSpan={maxOffers+props.numShowOffers} 
                            onClick={handleMpnClick(mpn)}>
                                {cell.render('Cell')}
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
            //return <></>;
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
            //return <></>;
        })}
    </tr>
    }
    </>
    )
}
function EmptyOfferRow(props){
    //offer without any 
}

function SubHeadingAttrs(props){
    const k = props.k;
    const offer = props.offer;
    const highlight = props.highlight;
    return(
        <>
        {props.apiSubHeadings.map((heading, j) => {
            //const out = offer[heading.accessor];
            const cn = highlight ? 'HighlightedCell': 'NormalCell';
            return(<td key={k+'heading'+j} className={cn}>
                {heading.accessor in offer && offer[heading.accessor]}
            </td>
            );
        }
        )}
        </>
    );
}