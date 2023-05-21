
export function findIndexStringSearchInArray(array, matching){
    const index = array.findIndex((val) => {
        return (typeof val === 'string') 
        ? matching.includes(val.toLowerCase()) 
        : false;
    });
    return index;
}

export function downloadFile(fileName, contents){
    const blob = new Blob([contents],{type:'application/json'});
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function reverseStringMap(m){
    const revM = Object.entries(m).reduce((mp, [k,v]) => {
        mp[v] = k;
        return mp;
    }, {});
    return revM;
}

export function trimObjects(data, fields){
    return data.map((obj) => {
        return trimObject(obj, fields);
    });
}

export function trimObject(obj, fields){
    if(obj === null) return null;
    return fields.reduce((o, f) => {
        if(f in obj) o[f] = obj[f];
        return o;
    }, {});
}

export function decodeStringBoolean(s){
    return s !== "0";
}

export function pickKeysObject(object, keys){
    /*
    const newObject = keys.reduce((obj, k) => {
        obj[k] = object[k];
        return obj;
    }, {});
    return newObject;*/
    return keys.reduce((a, e) => (a[e] = object[e], a), {});
}

export function objectToArray(object, keys){
    return keys.map((key) => object[key]);
}