// IMPORT NODE DEP
const http = require('http');
const fs = require('fs');
const { join, extname } = require('path');

// IMPORT THIRD PARTY DEP
const sass = require('sass');

const options = {
  targets: []
};

function setOptions(customOptions = undefined) {
  if (customOptions) {
    Object.assign(options, customOptions);
  }
  else {
    const args = process.argv.slice(2);
    let lastKey = null;

    for (let i = 0; i < args.length; i++) {
      const isKey = args[i].startsWith('--');

      if (isKey) {
        const slicedArg = args[i].slice(2);

        if (slicedArg === "targets") {
          continue;
        }

        else {
          if (lastKey !== null) {
            options[lastKey] = true;
          }

          lastKey = slicedArg
        }
      }

      else if (lastKey == null) {
        options.targets.push(args[i])
      }

      else {
        options[lastKey] = args[i];
        lastKey = null;
      }
    }

    if (lastKey !== null) options[lastKey] = true;
  }

  if (options.targets.length === 0) {
    delete options.targets;
  }

  return;
}

async function compiler() {
  const src = options.src || "src/sass";
  const outDir = options.outDir || "src/css";

  const files = options.targets || await fs.promises.readdir(join(process.cwd(), src));

  await fs.promises.mkdir(join(process.cwd(), outDir), { recursive: true });

  for (const fileName of files) {
    const ext = extname(fileName);

    if (ext === ".sass") {
      const compiled = await sass.compileAsync(join(process.cwd(), src, fileName));

      const formatedfileName = join(outDir, fileName.replace(ext, ".css"));
      await fs.promises.writeFile(join(process.cwd(), formatedfileName), compiled.css);
    }
  }

  return;
}

async function requestHandler(request, response) {
  if (extname(request.url) === ".html" || request.url === "/") {
    await compiler();
  }

  fs.createReadStream(request.url.substring(1) || join('.', 'index.html')).pipe(response);

  return;
}

function server(opt = undefined) {
  setOptions(opt)
  delete options.targets;

  const server = http.createServer(requestHandler);

  server.listen(options.port || 8000);

  console.log(`Server is running ${options.port || 8000} `);
};

function compile(userOptions = undefined) {
  setOptions(userOptions);
  return compiler();
}

module.exports = {
  server,
  compiler
};
