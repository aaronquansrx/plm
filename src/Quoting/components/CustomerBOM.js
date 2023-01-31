import {useState, useEffect} from 'react';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

function CustomerBOM(props){
    const [products, setProducts] = useState([]);
    useEffect(() => {
        const getData = {function: 'get_products', quote_id: props.quoteId, user: props.user}
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            setProducts(res.data.products);
        });
    }, []);
    function handleEditQuote(){
        if(props.toEditQuote) props.toEditQuote();
    }
    console.log(props.quoteId);
    function handleAddProduct(){

        const pd = {name: 'Product '+products.length.toString()};
        const postData = {product_details: pd, function: 'add_product', user: props.user, quote_id:props.quoteId};
        postPLMRequest('quote', postData,
            (res) => {
                console.log(res.data);
                setProducts(res.data.products);
            },
            (res) => {
                console.log('error');
                console.log(res.data);
            }
            );
    }
    return(
        <div>
            Customer BOM
            <Button variant="secondary" onClick={props.back}>Quote List</Button>
            <Button onClick={handleEditQuote}>Edit Quote</Button>
            <Button onClick={handleAddProduct}>Add Product</Button>
            <div>

            <div>
                <div>
                <h3>{props.quote.id}</h3>
                <h5>Customer: {props.quote.details.customer}</h5>
                <h6>Users: {props.quote.users.map(u => <Badge>{u}</Badge>)}</h6>
                <div>
                    Contents goes here
                </div>
                </div>
            </div>

            {products.map((p, i) => {
                return <div key={i}>{p.product_name}</div>
            })}
            </div>
        </div>
    );
}

export default CustomerBOM;