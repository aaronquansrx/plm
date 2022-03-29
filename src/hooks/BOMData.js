import {useState, useEffect} from 'react';

import update from 'immutability-helper';
import axios from 'axios';

import {useServerUrl} from './../hooks/Urls';

export function useApiData(req, mpnList, apisList, updateApiDataMap){
    console.log(mpnList);
    const serverUrl = useServerUrl();
    useEffect(() => {
        const controller = new AbortController();
        if(req > 0){
            const apiDataMap = new Map();
            function apiCallback(mpn, apiData){
                //console.log(mpn);
                apiDataMap.set(mpn, apiData);
                updateApiDataMap(apiDataMap);
                //addApiData(mpn, apiData);
            }

            mpnList.forEach(mpn => {
                callApi(mpn, serverUrl, controller, apisList, apiCallback);
            });
        }

        return () => {
            controller.abort();
        }
    }, [req]);
}

function callApi(mpn, serverUrl, controller, apis, callback){
    axios({
        method: 'GET',
        url: serverUrl+'api/part',
        params: {part: mpn},
        signal: controller.signal
    }).then(response => {
        console.log(response.data);
        callback(mpn, response.data.apis);
    });
}

function formatApiData(){
    //todo
}