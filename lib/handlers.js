class Handlers {
    publicVar = undefined
    
    constructor() {}
    
    getF(f) {return f}
}

function generateStaticMethods() {
    const methods = Object.getOwnPropertyNames(Handlers.prototype)
        .filter(m => 
            typeof Handlers.prototype[m] === 'function' // only functions
            && m !== 'constructor') // and no constructors
    console.log(methods)
    for (const m of methods) {
        // assign a static function with the same name as the instance function
        Handlers[m] = new Handlers()[m]
        // construct a new object, and return the corresponding instance function
    }
}

generateStaticMethods()

console.log(Handlers.getF(2))