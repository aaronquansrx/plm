

export default function useServerUrl(){
    const build_type = process.env.NODE_ENV;
    const server_url = build_type === 'production' ? 
    process.env.REACT_APP_SERVER_URL : process.env.REACT_APP_TEST_URL;
    return server_url+'api/';
}