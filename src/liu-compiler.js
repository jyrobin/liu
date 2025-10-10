// Prepare LIU TS plan source for sandboxed execution

export function prepareLiuModule(source) {
  let code = String(source);
  const imports = [];

  // Capture import lines of the form: import { a, b } from '...'; (any module path)
  code = code.replace(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"];?/g, (_, names) => {
    const idents = names.split(',').map(s => s.trim()).filter(Boolean);
    imports.push(...idents);
    return '';
  });

  // Rewrite export default to capture as global
  code = code.replace(/export\s+default\s+/, '__LIU_RESULT__ = ');

  // Inject tool binding prelude (helpers + tools). Helpers come first so tools can shadow if needed.
  const unique = Array.from(new Set(imports));
  const binding = `const { ${unique.join(', ')} } = Object.assign({}, __LIU_HELPERS__ || {}, __LIU_TOOLS__ || {});\n`;
  code = binding + code;

  return code;
}

