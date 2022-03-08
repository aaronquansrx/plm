

export function useServerUrl(){
    const build_type = process.env.NODE_ENV;
    const server_url = build_type === 'production' ? 
    process.env.REACT_APP_SERVER_URL : process.env.REACT_APP_TEST_URL;
    return server_url+'api/';
}

export function useClientUrl(){
    const build_type = process.env.NODE_ENV;
    const server_url = build_type === 'production' 
    ? process.env.REACT_APP_SERVER : process.env.REACT_APP_SERVER_TEST;
    const path = build_type === 'production' 
    ? process.env.REACT_APP_CLIENT_PATH : process.env.REACT_APP_TEST_PATH
    return server_url+path;
}