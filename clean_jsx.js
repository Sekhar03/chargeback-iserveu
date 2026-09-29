import fs from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

const code = fs.readFileSync('src/components/ViewChargeback.tsx', 'utf-8');
const ast = parse(code, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript'],
});

traverse.default(ast, {
  JSXText(path) {
    if (path.node.value.trim() === ');') {
      path.remove();
    }
  }
});

fs.writeFileSync('src/components/ViewChargeback.tsx', generate.default(ast).code);
console.log('Cleaned JSX floating parens');
