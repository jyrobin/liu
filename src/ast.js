// Liu AST (subset) — structure definition and lightweight constructors (optional, used for parsing/analysis)

export function Program(body = []) { return { type: 'Program', body }; }

// Statements
export function ConstDecl(id, init = null) { return { type: 'ConstDecl', id, init }; }
export function LetDecl(id, init = null) { return { type: 'LetDecl', id, init }; }
export function Assign(target, expr) { return { type: 'Assign', target, expr }; }
export function IfChain(branches, elseBlock = null) { return { type: 'IfChain', branches, elseBlock }; }
export function ExportDefault(expr) { return { type: 'ExportDefault', expr }; }

// Bindings/LValues
export function Ident(name) { return { type: 'Ident', name }; }
export function ObjDestruct(pairs) { return { type: 'ObjDestruct', pairs }; }
export function Member(object, property) { return { type: 'Member', object, property }; }

// Expressions
export function Call(callee, args) { return { type: 'Call', callee, args }; }
export function ObjLit(props) { return { type: 'ObjLit', props }; }
export function ArrayLit(items) { return { type: 'ArrayLit', items }; }
export function Literal(value) { return { type: 'Literal', value }; }
export function RefExpr(base, path = []) { return { type: 'RefExpr', base, path }; }
export function BinExpr(op, left, right) { return { type: 'BinExpr', op, left, right }; }
export function UnaryExpr(op, arg) { return { type: 'UnaryExpr', op, arg }; }

