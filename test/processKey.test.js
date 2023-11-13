import { processKey } from '../lib/processor'

test('normal keys', () => {
    const keys = ["abc123", "@abc123", "+abc123", "/cbe"] 
    for (const k of keys) {
        expect(processKey(k)).toBe(k)
    }
})

test('escaped keys', () => {
    const keys = ["-abc123", "-@abc123", "-/abc123/", "--abc", "-/"] 
    const ekeys = ["abc123", "@abc123", "/abc123/", "-abc", "/"] 
    for (let i = 0; i < keys.length; i++) {
        expect(processKey(keys[i])).toBe(ekeys[i])
    }
})

test('regex keys', () => {
    const keys = ["/abc123/", "/.+/", "//"] 
    const ekeys = [/abc123/, /.+/, new RegExp("")] 
    for (let i = 0; i < keys.length; i++) {
        expect(processKey(keys[i])).toEqual(ekeys[i])
    }
})