// TS AST-based parser for Liu subset (optional)
// Attempts to use 'typescript' at runtime; throws with code 'TS_NOT_AVAILABLE' if missing.

import { Program, ConstDecl, LetDecl, Assign, IfChain, ExportDefault, Ident, ObjDestruct, Member, Call, ObjLit, ArrayLit, Literal, RefExpr, BinExpr, UnaryExpr } from './ast.js';

export async function parseLiuTsToAst(source, options = {}) {
  let ts;
  try {
    ts = await import('typescript');
  } catch (e) {
    const err = new Error("TypeScript parser not available (dependency 'typescript' not installed)");
    err.code = 'TS_NOT_AVAILABLE';
    throw err;
  }
  const code = String(source);
  const sf = ts.createSourceFile('plan.liu.ts', code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);

  function withLoc(node, obj) {
    try {
      const start = node.getStart && node.getStart(sf) || 0;
      const end = node.getEnd && node.getEnd() || start;
      const s = sf.getLineAndCharacterOfPosition(start);
      return { ...obj, loc: { start, end, line: s.line + 1, column: s.character + 1 } };
    } catch (_) {
      return obj;
    }
  }

  function parseBindingName(node) {
    if (ts.isIdentifier(node)) return withLoc(node, Ident(node.text));
    if (ts.isObjectBindingPattern(node)) {
      const pairs = node.elements.map(el => {
        const name = ts.isIdentifier(el.propertyName || el.name) ? (el.propertyName || el.name).text : '';
        const alias = ts.isIdentifier(el.name) ? el.name.text : name;
        return { label: Ident(name), alias: Ident(alias) };
      });
      return withLoc(node, ObjDestruct(pairs));
    }
    return null;
  }

  function parseLValue(node) {
    if (ts.isIdentifier(node)) return withLoc(node, Ident(node.text));
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && ts.isIdentifier(node.name)) {
      return withLoc(node, Member(Ident(node.expression.text), Ident(node.name.text)));
    }
    return null;
  }

  function parseExpr(node) {
    if (!node) return null;
    if (ts.isStringLiteral(node)) return withLoc(node, Literal(node.text));
    if (node.kind === ts.SyntaxKind.NullKeyword) return withLoc(node, Literal(null));
    if (node.kind === ts.SyntaxKind.TrueKeyword) return withLoc(node, Literal(true));
    if (node.kind === ts.SyntaxKind.FalseKeyword) return withLoc(node, Literal(false));
    if (ts.isNumericLiteral(node)) return withLoc(node, Literal(Number(node.text)));
    if (ts.isIdentifier(node)) return withLoc(node, Ident(node.text));
    if (ts.isPropertyAccessExpression(node)) {
      let base = node.expression;
      const path = [];
      let cur = node;
      while (ts.isPropertyAccessExpression(cur)) {
        path.unshift(cur.name.text);
        cur = cur.expression;
      }
      if (ts.isIdentifier(cur)) return withLoc(node, RefExpr(Ident(cur.text), path.map(p => Ident(p))));
    }
    if (ts.isObjectLiteralExpression(node)) {
      const props = node.properties.map(p => {
        if (ts.isPropertyAssignment(p)) {
          const key = ts.isIdentifier(p.name) ? Ident(p.name.text) : Literal(p.name.getText(sf));
          const value = parseExpr(p.initializer);
          return { key, value };
        }
        if (ts.isShorthandPropertyAssignment(p)) {
          const key = Ident(p.name.text);
          const value = Ident(p.name.text);
          return { key, value };
        }
        return null;
      }).filter(Boolean);
      return withLoc(node, ObjLit(props));
    }
    if (ts.isArrayLiteralExpression(node)) {
      const items = node.elements.map(e => parseExpr(e));
      return withLoc(node, ArrayLit(items));
    }
    if (ts.isParenthesizedExpression(node)) return parseExpr(node.expression);
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
      return withLoc(node, UnaryExpr('!', parseExpr(node.operand)));
    }
    if (ts.isBinaryExpression(node)) {
      const opTok = node.operatorToken.kind;
      const opMap = {
        [ts.SyntaxKind.EqualsEqualsEqualsToken]: '===',
        [ts.SyntaxKind.ExclamationEqualsEqualsToken]: '!==',
        [ts.SyntaxKind.GreaterThanToken]: '>',
        [ts.SyntaxKind.GreaterThanEqualsToken]: '>=',
        [ts.SyntaxKind.LessThanToken]: '<',
        [ts.SyntaxKind.LessThanEqualsToken]: '<=',
        [ts.SyntaxKind.AmpersandAmpersandToken]: '&&',
        [ts.SyntaxKind.BarBarToken]: '||'
      };
      const op = opMap[opTok];
      if (op) return withLoc(node, BinExpr(op, parseExpr(node.left), parseExpr(node.right)));
    }
    if (ts.isCallExpression(node)) {
      const callee = ts.isIdentifier(node.expression) ? Ident(node.expression.text) : null;
      const args = node.arguments.map(a => parseExpr(a));
      return withLoc(node, Call(callee, args));
    }
    return null;
  }

  function parseIfChain(node) {
    const branches = [];
    let cur = node;
    while (cur) {
      const cond = parseExpr(cur.expression);
      const thenStmts = parseBlock(cur.thenStatement);
      branches.push({ cond, block: thenStmts });
      if (cur.elseStatement && ts.isIfStatement(cur.elseStatement)) {
        cur = cur.elseStatement;
      } else {
        const elseStmts = cur.elseStatement ? parseBlock(cur.elseStatement) : null;
        return withLoc(node, IfChain(branches, elseStmts));
      }
    }
    return withLoc(node, IfChain(branches, null));
  }

  function parseBlock(n) {
    const list = [];
    if (ts.isBlock(n)) {
      for (const stmt of n.statements) {
        const s = parseStatement(stmt);
        if (s) list.push(s);
      }
    } else {
      const s = parseStatement(n);
      if (s) list.push(s);
    }
    return list;
  }

  function parseStatement(node) {
    if (ts.isVariableStatement(node)) {
      const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
      const isLet = (node.declarationList.flags & ts.NodeFlags.Let) !== 0;
      const list = [];
      for (const decl of node.declarationList.declarations) {
        const id = parseBindingName(decl.name);
        const init = parseExpr(decl.initializer);
        list.push(withLoc(node, (isConst ? ConstDecl(id, init) : LetDecl(id, init))));
      }
      return list.length === 1 ? list[0] : list;
    }
    if (ts.isExpressionStatement(node) && ts.isBinaryExpression(node.expression) && node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const lhs = parseLValue(node.expression.left);
      const rhs = parseExpr(node.expression.right);
      return withLoc(node, Assign(lhs, rhs));
    }
    if (ts.isIfStatement(node)) {
      return parseIfChain(node);
    }
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      const call = parseExpr(node.expression);
      return withLoc(node, LetDecl(Ident('_'), call));
    }
    if (ts.isExportAssignment(node) && node.isExportEquals === false) {
      return withLoc(node, ExportDefault(parseExpr(node.expression)));
    }
    return null;
  }

  const body = [];
  for (const stmt of sf.statements) {
    const s = parseStatement(stmt);
    if (Array.isArray(s)) body.push(...s); else if (s) body.push(s);
  }
  return Program(body);
}

