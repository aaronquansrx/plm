import React, {useEffect, useState, useRef} from 'react';

import { getPLMRequest } from '../../scripts/APICall';

export function useQuoteRoles(user){
    const [duties, setDuties] = useState({});
    const isAdmin = useRef(false);
    useEffect(() => {
        if(user){
            isAdmin.current = user.is_admin;
            const getUserDuty = {
                function: 'user_role_duties', user_id: user.id
            }
            getPLMRequest('user', getUserDuty, 
            (res) => {
                if(res.data.success && res.data.has_role){
                    if(res.data.has_role){
                        setDuties(res.data.duties);
                    }
                }
            },
            (res) => {
                console.log(res.data);
            });
        }else{
            isAdmin.current = false;
        }
    }, [user]);

    return [duties, isAdmin.current];
}