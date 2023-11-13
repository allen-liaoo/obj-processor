import { throwLibError, isPureObject } from "./util"

const defaultConfig = {
    mode: "nonrec",
    recDepth: undefined,
    result: undefined
}

export function process(schema, value, config) {    // TODO: export default
    const newconfig = {
        ...defaultConfig,   // override default config
        ...config
    }
    validateConfig(newconfig)
}

function validateConfig(config) {
    if (!config.recDepth) {
        if (config.mode == "nonrec") config.recDepth = 0
        else if (config.mode == "rec") config.recDepth = -1
    }

    if (config.mode == "nonrec" && config.recDepth != 0) {
        throwLibError("config", "nonrec mode cannot have a rec depth of non-zero!")
    }
}

export function processKey(key) {
    // Escaped string, strip '-' and return
    if (key.startsWith('-')) {
        return key.substring(1)
    // Regex key
    } else if (key.startsWith('/') && key.endsWith('/') && key.length > 1) {
        return new RegExp(key.substring(1, key.length-1))   // returns RegExp
    }
    return key
}

// A schema can be
// An object schema
// An array of schemas, where the last object schema is the only object schema, and 
// the functions are executed in the order they are listed
export function wrapSchema(schema) {
    const wrapper = {
        handlers: undefined,
        obj_schema: undefined,
        regexs: undefined
    }

    // Array schema
    if (Array.isArray(schema) && schema.length > 0) {
        for (const sch of schema) {
            // If element is an object schema
            if (isPureObject(sch)) {
                // Since this sch is applied on each array element, we replace the values in obj_schema and regexs with 
                // The return result of recursing on the sch
                const objSchema = wrapSchema(sch)
                wrapper.obj_schema = objSchema.obj_schema
                wrapper.regexs = objSchema.regexs
                // TODO: warning for overriding object schema?
            } else if (sch instanceof Function) {
                if (!wrapper.handlers) wrapper.handlers = []
                wrapper.handlers.push(sch)
            } else {
                throwLibError("schema", "unknown schema type in schema array!")
            }
        }
    }

    // Object schema
    else if (isPureObject(schema)) {
        wrapper.obj_schema = {}
        for (const [key, value] of Object.entries(schema)) {
            const nKey = processKey(key)
            const valSchema = wrapSchema(value)
            if (nKey instanceof RegExp) {
                if (!wrapper.regexs) wrapper.regexs = []
                wrapper.regexs.push([nKey, valSchema])
            } else {
                wrapper.obj_schema[nKey] = valSchema
            }
        }
    }

    // Singular handler
    else if (schema instanceof Function) {
        if (!wrapper.handlers) wrapper.handlers = []
        wrapper.handlers.push(schema)
    }

    else {
        throwLibError("schema", "unknown schema type!")
    }
    return wrapper
}

/* Internal function for matching schema to value and dispatching handlers */
export function matchObject(schema, value, recmode, depth) {
    if (recDepth < 0 && !recmode) return

    for (const key in value) {
        const value = obj[key]
        // Found key
        // Either key matches a key's name
        // Or no keys specified, and value is not an object nor array
        // if (keys.includes(key) ||
        //     (noKeys && typeof value !== 'object')) {
        //     // console.log(`Found: ${key}, ${value}`)
        //     obj[key] = callback(key, value)
        // }

        if (Array.isArray(value)) //searchArray(value, callback, recDepth)
        if (isPureObject(value)) {
            const schValue = schema[value]
            matchObject(schValue, value, recmode, depth-1)
        }
    }
}