// 足し算を行うプログラム
const a = 5;
const b = 10;

const result = sum(a, b);

// 結果表示
console.log(`${a} + ${b} = ${result}です`);

// 関数 sumを定義
function sum(a: number, b: number): number{
  return a + b;
}
