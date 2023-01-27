import {useState, useEffect} from 'react';
import Button from 'react-bootstrap/Button';

function CustomerBOM(props){
    function handleEditQuote(){
        if(props.toEditQuote) props.toEditQuote();
    }
    return(
        <div>
            Customer BOM
            <Button onClick={handleEditQuote}>Edit Quote</Button>
        </div>
    );
}

export default CustomerBOM;