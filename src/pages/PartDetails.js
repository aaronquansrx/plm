import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";

import axios from 'axios';

const build_type = process.env.NODE_ENV;
const server_url = build_type === 'production' ? 
process.env.REACT_APP_SERVER_URL : process.env.REACT_APP_TEST_URL;

function PartDetails(props){
    const params = useParams();
    const [details, setDetails] = useState(null);
    //console.log(params);
    useEffect(() => {
        const part = params.partId;
        axios({
            method: 'get',
            url: server_url+'api/partdetails',
            params: {part: part, save: true}
        }).then(res =>{
            //console.log(res.data);
            if(res.data.status === 'success') setDetails(res.data.details);
            console.log(res.data.details);
        })
    }, []);
    return(
        <div>
            <h1>{params.partId}</h1>
            {details && 
            <div>
            <div>Manufacturer: <span>{details.Manufacturer}</span></div>
            <img src={details.Photo} width='150px' height='150px'/>
            <div>Category: <span>{details.Category}</span></div>
            <div>{details.Description}</div>
            <div>RoHS: <span>{details.RoHS}</span></div>
            <div>Lead: <span>{details.Lead}</span></div>
            <DisplayDetails parameters={details.Parameters}/>
            <Urls urls={details.Urls}/>
            </div>
            }
        </div>
    )
}

function Urls(props){
    return(
        <div>
            <b>Urls</b>
            {Object.entries(props.urls).map(([k,v], i) => {
                return(
                    <div key={i}>
                        {k}: <a href={v}>{v}</a>
                    </div>
                );
            })}
        </div>
    )
}

function DisplayDetails(props){
    const parameters = Object.entries(props.parameters);
    return(
        <div>
            <b>Parameters</b>
            {parameters.map(([k,v], i) => {
                return(
                    <div key={i}>
                        {k}: <span>{v}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default PartDetails;