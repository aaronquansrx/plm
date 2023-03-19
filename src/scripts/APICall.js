import axios from 'axios';

function getServerUrl(){
    const build_type = process.env.NODE_ENV;
    const server_url = build_type === 'production' ? 
    process.env.REACT_APP_SERVER_URL : process.env.REACT_APP_TEST_URL;
    return server_url;
}

function clientUrl(){
    const build_type = process.env.NODE_ENV;
    const server_url = build_type === 'production' 
    ? process.env.REACT_APP_CLIENT_URL : process.env.REACT_APP_CLIENT_URL_TEST;
    const path = build_type === 'production' 
    ? process.env.REACT_APP_CLIENT_PATH : process.env.REACT_APP_TEST_PATH
    return server_url+path;
}

const serverUrl = getServerUrl();
console.log(serverUrl);

export function getPLMRequest(url, params, callback=null, errorCallback=null, controller=null){
    axios({
        method: 'GET',
        url: serverUrl+'api/'+url,
        params: params,
        signal: controller ? controller.signal : null
    }).then(response => {
        if(typeof response.data !== 'object'){
            if(errorCallback) errorCallback(response);
        }else{
            if(callback) callback(response);
        }

    });
}

export function postPLMRequest(url, data, callback=null, errorCallback=null, controller=null){
    axios({
        method: 'POST',
        url: serverUrl+'api/'+url,
        data: data,
        signal: controller ? controller.signal : null
    }).then(response => {
        if(typeof response.data !== 'object'){
            if(errorCallback) errorCallback(response);
        }else{
            if(callback) callback(response);
        }

    });
}