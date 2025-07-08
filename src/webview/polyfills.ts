// Polyfills for Node.js globals in browser environment
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.process = {
        env: { NODE_ENV: 'production' },
        platform: 'browser' as any,
        version: ''
    } as any;

    // @ts-ignore
    window.Buffer = {
        isBuffer: (obj: any): obj is any => false
    };

    // @ts-ignore
    window.util = {
        inherits: () => { },
        format: (str: string, ...args: any[]) => str.replace(/%s/g, () => args.shift() || '')
    };

    // @ts-ignore
    window.path = {
        join: (...args: string[]) => args.join('/'),
        resolve: (...args: string[]) => args.join('/'),
        dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
        basename: (p: string) => p.split('/').pop() || '',
        extname: (p: string) => {
            const parts = p.split('.');
            return parts.length > 1 ? '.' + parts.pop() : '';
        }
    };

    // @ts-ignore
    window.fs = {
        readFileSync: () => '',
        writeFileSync: () => { },
        existsSync: () => false
    };

    // @ts-ignore
    window.os = {
        platform: () => 'browser',
        homedir: () => '/',
        tmpdir: () => '/tmp'
    };

    // Don't override window.crypto as it's read-only
    // Instead, add randomBytes to the existing crypto object if it doesn't exist
    if (window.crypto && !(window.crypto as any).randomBytes) {
        (window.crypto as any).randomBytes = (size: number) => {
            const bytes = new Uint8Array(size);
            for (let i = 0; i < size; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
            return bytes;
        };
    }

    // @ts-ignore
    window.stream = {
        Readable: class { },
        Writable: class { },
        Transform: class { }
    };

    // @ts-ignore
    window.url = {
        parse: (url: string) => ({ href: url, protocol: 'https:', host: 'localhost' }),
        format: (obj: any) => obj.href || '',
        resolve: (base: string, href: string) => href
    };

    // @ts-ignore
    window.querystring = {
        parse: (str: string) => {
            const params = new URLSearchParams(str);
            const result: any = {};
            for (const [key, value] of params) {
                result[key] = value;
            }
            return result;
        },
        stringify: (obj: any) => new URLSearchParams(obj).toString()
    };

    // @ts-ignore
    window.zlib = {
        gzip: () => Promise.resolve(Buffer.from('')),
        gunzip: () => Promise.resolve(Buffer.from(''))
    };

    // @ts-ignore
    window.http = {
        request: () => ({ on: () => { }, write: () => { }, end: () => { } })
    };

    // @ts-ignore
    window.https = {
        request: () => ({ on: () => { }, write: () => { }, end: () => { } })
    };

    // @ts-ignore
    window.assert = {
        ok: (value: any) => {
            if (!value) throw new Error('Assertion failed');
        },
        equal: (a: any, b: any) => {
            if (a !== b) throw new Error(`Assertion failed: ${a} !== ${b}`);
        }
    };

    // @ts-ignore
    window.constants = {};

    // @ts-ignore
    window.events = {
        EventEmitter: class {
            on() { return this; }
            emit() { return true; }
            once() { return this; }
            removeListener() { return this; }
        }
    };

    // @ts-ignore
    window.punycode = {
        decode: (str: string) => str,
        encode: (str: string) => str
    };

    // @ts-ignore
    window.string_decoder = {
        StringDecoder: class {
            write() { return ''; }
            end() { return ''; }
        }
    };

    // @ts-ignore
    window.tty = {
        isatty: () => false
    };

    // @ts-ignore
    window.vm = {
        runInNewContext: (code: string) => eval(code)
    };

    // @ts-ignore
    window.domain = {
        create: () => ({ run: (fn: Function) => fn(), enter: () => { }, exit: () => { } })
    };

    // @ts-ignore
    window.module = {
        exports: {}
    };

    // @ts-ignore
    window.net = {
        createConnection: () => ({ on: () => { }, write: () => { }, end: () => { } })
    };

    // @ts-ignore
    window.child_process = {
        spawn: () => ({ on: () => { }, stdout: { on: () => { } }, stderr: { on: () => { } } }),
        exec: () => ({ on: () => { } })
    };

    // @ts-ignore
    window.cluster = {
        isMaster: false,
        isWorker: false
    };

    // @ts-ignore
    window.dgram = {
        createSocket: () => ({ on: () => { }, bind: () => { }, send: () => { } })
    };

    // @ts-ignore
    window.dns = {
        lookup: () => { },
        resolve: () => { }
    };

    // @ts-ignore
    window.readline = {
        createInterface: () => ({ on: () => { }, question: () => { }, close: () => { } })
    };

    // @ts-ignore
    window.repl = {
        start: () => { }
    };

    // @ts-ignore
    window.tls = {
        connect: () => ({ on: () => { }, write: () => { }, end: () => { } })
    };

    // @ts-ignore
    window.v8 = {
        getHeapStatistics: () => ({})
    };

    // @ts-ignore
    window.worker_threads = {
        Worker: class {
            constructor() { }
            on() { return this; }
            postMessage() { }
            terminate() { }
        }
    };
} 