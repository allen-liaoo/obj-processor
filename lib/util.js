export function throwLibError(where, message) {
    throw `obj-processor: ${where} - ${message}`
}

// helper to check if a value is a pure js object
// returns false for arrays, functions, Number, String, etc.
export function isPureObject(value) {
    return value !== null
        && typeof value === 'object'
        && Object.getPrototypeOf(value).isPrototypeOf(Object);
}