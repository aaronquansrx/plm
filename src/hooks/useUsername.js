import { useState } from 'react';

//https://www.digitalocean.com/community/tutorials/how-to-add-login-authentication-to-react-applications#step-3-storing-a-user-token-with-sessionstorage-and-localstorage

//use localstorage instead of sessionstorage to store data across windows
export default function useUsername(){
    const getUsername = () => {
        const userString = sessionStorage.getItem('username');
        //console.log(userString);
        const un = JSON.parse(userString);
        return un;
    }
    //console.log(getUsername());
    const [username, setUsername] = useState(getUsername());

    const saveUsername = un => {
        sessionStorage.setItem('username', JSON.stringify(un));
        setUsername(un);
        //console.log(un);
    };
    return [saveUsername, username];
}