import React, {useEffect, useState} from 'react';

import Accordion from 'react-bootstrap/Accordion'
import Table from 'react-bootstrap/Table';
import './../css/offer.css';

export function SimpleOffer(props){
    return (
        <Accordion>
            {props.offers.map((offer, i) => 
                <Accordion.Item eventKey={i}>
                    <Accordion.Header>Offer {i+1}</Accordion.Header>
                    <Accordion.Body>
                    <div className='Offer'>
                    <span>
                        {'Quantity Available: '+offer.Quantity.Available}
                    </span>
                    <span>
                    <Table bordered hover>
                    <thead>
                    <th>Break Quantity</th><th>Price</th>
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