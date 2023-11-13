import { wrapSchema } from '../lib/processor'

test('error schema', () => {
    const errs = [1, true, false, null, undefined, [], [[]], [1], [true], [null], [undefined]]
    errs.forEach(e => () => expect(wrapSchema(e)).toThrow())
})

test('single schema', () => {
    const testF = () => {}

    expect(wrapSchema(testF)).toEqual({
        handlers: [testF]
    })

    expect(wrapSchema({})).toEqual({obj_schema: {}})

    expect(wrapSchema({a: testF})).toEqual({obj_schema: {a: {handlers:[testF]}}})
})

test('multiple schemas', () => {
    const testF = () => {}
    const testG = () => {return 1}
    expect(wrapSchema([
        {},
        testF,
        {
            a: [testF, testG],
            "/.+/": [testF, testG]
        },
        testG
    ]
    )).toEqual({
        handlers: [testF, testG],
        obj_schema: {
            a: {handlers: [testF, testG]}
        },
        regexs: [[new RegExp(".+"), {handlers: [testF, testG]}]]
    })
})