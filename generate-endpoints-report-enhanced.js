/**
 * generate-endpoints-report-enhanced.js
 *
 * - Guardar en la raíz del repo.
 * - Instalar dependencia: npm install --save-dev glob
 * - Ejecutar: node generate-endpoints-report-enhanced.js endpoints-report.md
 *
 * Genera endpoints-report.md con detalle de DTOs (propiedades y obligatoriedad).
 *
 * Nota: es heurístico (regex). Si el repo usa patterns dinámicos, pegá los DTOs aquí y yo lo completo.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    return '';
  }
}

function findFiles(pattern) {
  return glob.sync(pattern, {
    nodir: true,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });
}

function extractControllers(filePath) {
  const txt = read(filePath);
  const controllers = [];
  const ctrlMatch = txt.match(/@Controller\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/);
  const ctrlRoute = ctrlMatch ? ctrlMatch[1] : '';
  const classMatch =
    txt.match(/export\s+class\s+([A-Za-z0-9_]+)/) ||
    txt.match(/class\s+([A-Za-z0-9_]+)/);
  const className = classMatch ? classMatch[1] : path.basename(filePath);

  // Match method decorators and following method signature
  const methodRegex =
    /(@(Get|Post|Patch|Delete|Put|Options|Head|All)\s*(\(\s*['"`]?([^'"`]*)['"`]?\s*\))?)[\s\S]*?(?:\n\s*(?:public|private|protected|async)?\s*[A-Za-z0-9_]+\s*\(|\n\s*[A-Za-z0-9_]+\s*\()/g;
  let m;
  while ((m = methodRegex.exec(txt)) !== null) {
    const decFull = m[1];
    const http = m[2];
    const routeArg = (m[4] || '').trim();
    const snippetStart = m.index + decFull.length;
    const snippet = txt.slice(snippetStart, snippetStart + 1200); // larger snippet to include signature lines
    const nameMatch = snippet.match(
      /(?:async\s+|public\s+|private\s+|protected\s+)?([A-Za-z0-9_]+)\s*\(/,
    );
    const methodName = nameMatch ? nameMatch[1] : 'unknownMethod';
    const signatureMatch = snippet.match(/([^\{]*)\{/);
    const signature = signatureMatch ? signatureMatch[1] : '';

    const params = { body: null, params: [], query: [] };

    // Try to find @Body() usage in signature
    const bodyRegexes = [
      /@Body\(\s*['"`]?[^\)]*['"`]?\s*\)\s*([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_<>\[\]\.|]+)/,
      /@Body\(\s*['"`]?[^\)]*['"`]?\s*\)\s*:\s*([A-Za-z0-9_<>\[\]\.|]+)/, // less common
    ];
    for (const br of bodyRegexes) {
      const b = signature.match(br);
      if (b) {
        if (b[2]) params.body = { name: b[1], type: b[2] };
        else params.body = { name: null, type: b[1] };
        break;
      }
    }

    // @Param('id') id: string
    const paramMatches = Array.from(
      signature.matchAll(
        /@Param\(\s*['"`]?([^'"`)]*)['"`]?\s*\)\s*([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_<>\[\]\.|]+)/g,
      ),
    );
    for (const p of paramMatches) {
      params.params.push({
        decoratorArg: p[1] || null,
        name: p[2],
        type: p[3],
      });
    }

    // @Query('q') q: Type
    const queryMatches = Array.from(
      signature.matchAll(
        /@Query\(\s*['"`]?([^'"`)]*)['"`]?\s*\)\s*([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_<>\[\]\.|]+)/g,
      ),
    );
    for (const q of queryMatches) {
      params.query.push({ decoratorArg: q[1] || null, name: q[2], type: q[3] });
    }

    const before = txt.slice(Math.max(0, m.index - 400), snippetStart);
    const decorMatches = Array.from(before.matchAll(/@([A-Za-z0-9_]+)/g)).map(
      (x) => x[1],
    );
    const uniqueDecs = Array.from(new Set(decorMatches));
    const returnMatch = snippet.match(/\)\s*:\s*([A-Za-z0-9_<>\[\]\.|]+)/);
    const returnType = returnMatch ? returnMatch[1] : 'indeterminado';

    controllers.push({
      source: filePath,
      className,
      controllerRoute: ctrlRoute,
      methodName,
      httpMethod: http.toUpperCase(),
      routePath: routeArg,
      decorators: uniqueDecs,
      params,
      returnType,
    });
  }
  return controllers;
}

function findDto(dtoName) {
  if (!dtoName) return null;
  const clean = dtoName.replace(/\[\]$/, '').replace(/^Array<(.+)>$/, '$1');
  const files = findFiles('**/*.ts');
  for (const f of files) {
    const txt = read(f);

    // Try class definition
    const classRegex = new RegExp(
      '(export\\s+)?class\\s+' + escapeRegExp(clean) + '\\b[^{]*{([\\s\\S]*?)}',
      'm',
    );
    const classMatch = txt.match(classRegex);
    if (classMatch) {
      const body = classMatch[2];
      const props = parsePropsFromBlock(body);
      return { file: f, props };
    }

    // Try interface
    const ifaceRegex = new RegExp(
      '(export\\s+)?interface\\s+' +
        escapeRegExp(clean) +
        '\\b[^{]*{([\\s\\S]*?)}',
      'm',
    );
    const ifaceMatch = txt.match(ifaceRegex);
    if (ifaceMatch) {
      const body = ifaceMatch[2];
      const props = parsePropsFromBlock(body, true);
      return { file: f, props };
    }
  }
  return null;
}

function parsePropsFromBlock(block, isInterface = false) {
  const lines = block.split(/\r?\n/);
  const props = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const lookback = lines.slice(Math.max(0, i - 5), i + 1).join('\n');

    // property patterns like: name?: string;  or name: string;
    const propMatch = line.match(
      /^(?:public|private|protected|readonly)?\s*([A-Za-z0-9_]+)(\?)?\s*:\s*([A-Za-z0-9_<>\[\]\.|]+)\s*(?:;|=|$)/,
    );
    if (propMatch) {
      const name = propMatch[1];
      const hasQuestion = !!propMatch[2];
      const type = propMatch[3];
      const hasIsOptional = /@IsOptional\(/.test(lookback);
      const hasIsNotEmpty =
        /@IsNotEmpty\(/.test(lookback) ||
        /@IsDefined\(/.test(lookback) ||
        /@IsEmail\(/.test(lookback);
      // required if not marked optional and not a question mark; presence of IsNotEmpty/IsDefined suggests required
      const required =
        !hasIsOptional && !hasQuestion && (hasIsNotEmpty || !hasQuestion);
      props.push({
        name,
        type,
        required: !!required,
        decorators: Array.from(
          new Set(
            Array.from(lookback.matchAll(/@([A-Za-z0-9_]+)/g)).map((x) => x[1]),
          ),
        ),
      });
    }
  }
  return props;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateMD(entries) {
  let md = '# Informe de Endpoints (detalle de campos)\n\n';
  md +=
    'Generado heurísticamente. Verifica manualmente los casos complejos.\n\n';
  for (const e of entries) {
    const fullPath = path.posix.join(
      '/',
      e.controllerRoute || '',
      e.routePath || '',
    );
    md += '---\n';
    md += `### ${e.className}\n`;
    md += `**Archivo origen:** \`${e.source}\`\n`;
    md += `**Ruta:** \`${fullPath}\`\n`;
    md += `**Método HTTP:** \`${e.httpMethod}\`\n`;
    md += `**Descripción breve:** \`${e.methodName}\`\n`;
    md += `**Middleware o decoradores:** ${e.decorators.length ? e.decorators.join(', ') : 'Ninguno detectado'}\n`;
    md += `**Body esperado (DTO):**\n`;
    if (e.params.body && e.params.body.type) {
      const dto = findDto(e.params.body.type);
      if (dto) {
        md += `- DTO: \`${e.params.body.type}\` (definido en \`${dto.file}\`)\n`;
        if (dto.props.length) {
          for (const p of dto.props) {
            md += `  - ${p.name}: ${p.type} — ${p.required ? 'obligatorio' : 'opcional'}`;
            if (p.decorators && p.decorators.length)
              md += ` — decoradores: ${p.decorators.join(', ')}`;
            md += '\n';
          }
        } else {
          md += '  - (No se detectaron propiedades en el DTO)\n';
        }
      } else {
        md += `- Tipo de body: ${e.params.body.type} (no se encontró definición de DTO)\n`;
      }
    } else {
      md += '- No aplica\n';
    }
    md += `**Query params:**\n`;
    if (e.params.query.length) {
      for (const q of e.params.query)
        md += `- ${q.decoratorArg || q.name}: ${q.type} — opcional/indeterminado\n`;
    } else md += '- No hay query params\n';
    md += `**Params (ruta):**\n`;
    if (e.params.params.length) {
      for (const p of e.params.params)
        md += `- ${p.decoratorArg || p.name}: ${p.type} — requerido\n`;
    } else md += '- No hay params\n';
    md += `**Respuesta esperada:** ${e.returnType}\n\n`;
  }
  md += '---\n';
  return md;
}

(function main() {
  const out = process.argv[2] || 'endpoints-report.md';
  const controllerFiles = findFiles('**/*controller.ts');
  if (!controllerFiles.length) {
    console.error(
      'No se encontraron archivos *controller.ts. Ejecutá desde la raíz del repo.',
    );
    process.exit(1);
  }
  const entries = [];
  for (const f of controllerFiles) {
    const infos = extractControllers(f);
    for (const inf of infos) entries.push(inf);
  }
  const md = generateMD(entries);
  fs.writeFileSync(out, md, 'utf8');
  console.log('Generado:', out);
})();
