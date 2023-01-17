
export const alpha = Array.from(Array(26)).map((e, i) => i + 65);
export const alphabet = alpha.map((x) => String.fromCharCode(x));
export const alphaValue = alphabet.reduce((obj, letter, i) => {
    obj[letter] = i + 1;
    return obj;
}, {});

function replaceStringIndex(str, i, r){
    return str.substring(0,i) + r + str.substring(i+1);
}

function letterValue(letter){
    let i = letter.length - 1;
    let multi = 1;
    let total = 0;
    while(i >= 0){
        total += alphaValue[letter.charAt(i)] * multi;
        multi *= 26;
        i--;
    }
    return total;
}

function decodeRef(sheet){
    const dims = sheet['!ref'].split(':');
    const letterX = dims[1].match('^[A-Z]*')[0];
    const maxX = letterValue(letterX);
    const maxY = parseInt(dims[1].match('[0-9]*$')[0]);
    return [letterX, maxX, maxY];
}