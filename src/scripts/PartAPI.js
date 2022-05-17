
import axios from 'axios';

import { useServerUrl } from '../hooks/Urls';
//doesn't work can't use in hook use effect
export function useCallPart(mpn, func, controller=null){
    const server_url = useServerUrl();
    axios({
        method: 'get',
        url: server_url+'api/part',
        params: {part: mpn},
        signal: controller ? controller.signal : null
    }).then(response => {
        func(response.data);
    });
}