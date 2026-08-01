// Vite 特有导入类型 + 测试环境 Node 类型声明。
// tests/ui/* 通过 node:fs 直接读 main.css 做 CSS 契约断言（?raw 在本 vitest 环境返回空串）。

declare module 'node:fs' {
  export function readFileSync(path: string, encoding?: string): string;
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
}

declare const __dirname: string;
