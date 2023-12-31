# obj-processor
## Matcher
A matcher takes a schema, comparing it with the value it is matching against, (recursively or not), then call corresponding processors for each value matched

### Configurations
A config applies to all matches made by a matcher. Each config has a name and some values. If the config name or value isn’t recognized, an error will be thrown
1. mode: rec | nonrec (default: nonrec)
   - In recursive mode, the schema is taken and matched on each inner-object and array, until recDepth is reached.
   - In nonrec mode, the schema is taken and matched on the value straightforwardly
2. recDepth: number - the depth of the recursion, -1 for no limit (default: -1 for rec mode, 0 for nonrec).
3. result: any - the default value of the result (default: undefined). To collect a list of results, you can use an empty list.
4. transformer: the transformer function called before and after a processor

### Transformer
A transformer is a function called before any chain of processors is called, between each processor, and after all processors of a chain is called.
A transformer can have these arguments
1. `at: start | end | between`
2. `prevVal`: the value returned by the previous processor (undefined if at the start)
3. `context`: same as processor’s context
The transformers return value overrides the processor’s and becomes the new resulting value.

## Schemas
Schemas appear like the objects they are matched against. Schemas can be
- An object schema that matches objects. The schema’s keys could be regexes (as strings), and the values are schemas.
- Function (Processor)
- An array of
    - a single object schema: the schema is matched on each element of the array
    - Functions, where each processor takes the result from the previous processor, processes it, then provides the result to the next processor

Schema keys can be
- **Regex keys** `/regex/`: write what you would for a js regex literal (without options). It matches all keys that matches the regex. If no keys matches the regex, the value is processed once with undefined. 
- Escaped key `“-key”`: escape any special notation and treat what’s after `-` as is. the leading `-`  is stripped from the string no matter what  
i.e. `“-/regex/“` matches key equal to `“/regex/“`

Examples
- `{“/.+_id/“: processID}`: Schema that matches all keys ending with `_id` and call processor processID (recDepth = -1)
- `{“?email”: [“require”, “email”], “?password”: [“require”, minLength(6)]}`

## Processor
A function with these arguments:
1. value: the value matched, possibly undefined 
2. context(optional): an object that persists throughout a processor chain. To make implementation easier, context is predefined with some fields and convention on how to use them.
```js
{
    key?: string, // the key of the value, possibly undefined for matching values without a key
    result: any   // a place to put what you want the matcher to return (see @result)
}
```
- To stop the chain of processor, throw a StopProcessor error.
- Note that any other errors thrown in the processors will propagate up and stop the matcher.
- The returned value of the processor is assigned back to the variable it processed. If there is a transformer, it is first called with the transformer, and the result of that call is assigned back to the variable.

## Built-In Processors
### Matcher Control
Built into the matcher as it would otherwise be hard to extend
1. ifExist() – stop the chain of processors if value does not exist
2. forEach() – the following processors gets each value individually
### Parsers
The below functions are bundled at parsers.bundle. 
They do not throw errors. If you want to validate the values, used validators
1. toNum
2. toBool - string to bool
3. toString - JSON.stringify()
### Validators
The below functions are bundled at validators.bundle. To use the bundle without extra work, use validators.match()All functions have static and instance versions to allow for method chaining:Validator.required().
1. General
    1. required()
    2. not() – flips the result of the next function call
    3. equal(v) – is equal to v
    4. default(v) – set default value if value does not exist
    5. satisfies(predicate) - must satisfy the predicate
2. Type
    1. number()
    2. int()
    3. posInt()
    4. bool()
    5. array()
    6. string()
    7. email([domain]) - matching some domain
    8. date()
3. String/Array
    1. minLen(n)
    2. maxLen(m)
    3. len(n)
4. Number
    1. min(n) - min value
    2. max(m) - max value
5. Object
    1. 
6. Util
    1. regex(regex)
    2. in(list)

#### processKey() procedure (internal)
Given a key string, return either a string or RegExpr
1. If the key is escaped (key = `-key`), strip `-` and return the rest of the string (this case handles escaping regex)
2. If the key is a regex, strip enclosing `/` and return RegExpr
3. Otherwise return string unchanged (handles @processors)

#### processSchema() procedure (internal)
Validates a schema and transform it into SchemaWrapper for easier processing
```js
SchemaWrapper: {
    processors?: function[],                // list of processors for the current value, or [obj_schema]
    obj_schema?: SchemaWrapper,
    regexes: <RegExp, SchemaWrapper>[], 	// /keys/
}
```
1. If schema is a function: `schema = [processor]`
2. If schema is an array:  
    1. If the first element is an object:  
    if length != 1, error  
    `wrapper.processors = [processSchema(obj)]`
    2. Otherwise, for each element e,
        if e is not a function, error  
        `wrapper.processors = array of functions`
3. If schema is an object: wrapper.obj_schema = {}
    1. For each key,  
    `newKey = processKey(key)`
        1. If `newKey` is regex:  
        `wrappers.regexs = wrappers.regexs ?? []`
        `wrappers.regexes.add([regex, processSchema()]`
        2. If otherwise, continue:
    2. For each value,  
    `valSchema = processSchema(value)`  
    Add to obj_schema, if already exists, error  
    `wrapper.obj_schema[newKey] = valSchema`


#### matchRec() procedure (internal)
Given a schema wrapper, value, and config:

#### match() procedure (internal)
Given a schema and a value, and config:
`wrapper = processSchema(schema)`  
Then if:
1. Value is an array
    1. If 
2. Value is an object:  
    `usedReg = []`
    1. For each `(key, kval)` in value:
        1. if key in wrapper.obj_schema:  
            `match(wrapper.obj_schema[key], kval)`
        2. for (regex, regSchema) in wrapper.regexes:  
            1. if (regex.match(key)):  
                `match(regSchema, kval)usedReg.add(regex)`
        3. for all (regex, regSchema) in wrapper.regexes but not in usedReg:  
        `match(regSchema, undefined)`