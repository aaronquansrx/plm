import { useState } from 'react';

export function useLocalStorage(storeName){
    const getStorage = () => {
        const value = localStorage.getItem(storeName);
        const jsonVal = JSON.parse(value);
        return jsonVal;
    }
    const [storage, setStorage] = useState(getStorage());
    const saveStorage = val => {
        localStorage.setItem(storeName, JSON.stringify(val));
        setStorage(val);
    }
    return [storage, saveStorage];
}

export function useSessionStorage(storeName){
    const getStorage = () => {
        const value = sessionStorage.getItem(storeName);
        const jsonVal = JSON.parse(value);
        return jsonVal;
    }
    const [storage, setStorage] = useState(getStorage());
    const saveStorage = val => {
        sessionStorage.setItem(storeName, JSON.stringify(val));
        setStorage(val);
    }
    return [storage, saveStorage];
}