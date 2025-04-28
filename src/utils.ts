import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Check if bun is available on system or not
 * @returns true if bun is available, false otherwise
 */
export function checkBun() {
  try {
    if (typeof Bun === 'undefined') return false;
    return Bun.which("bun") !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Create project folder
 * @param projectPath Path where the project should be created
 * @throws Error if folder already exists
 */
export async function createProjectFolder(projectPath: string) {
  try {
    await mkdir(projectPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Project folder "${path.basename(projectPath)}" already exists`);
    }
    throw error;
  }
}

/**
 * Generate project files based on type
 * @param projectPath Path where the project should be created
 * @param answers Project configuration answers
 */
export async function generateProjectFiles(projectPath: string, answers: any) {
  const srcPath = path.join(projectPath, 'src');
  await mkdir(srcPath);
  
  await writeFile(
    path.join(projectPath, '.gitignore'),
    `# Based on https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Caches
.cache

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage
*.lcov

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# Build output
dist

# IDE
.idea
.vscode

# OS
.DS_Store
`
  );

  await writeFile(
    path.join(projectPath, 'README.md'),
    `# ${answers.projectName}\n\n${answers.description}\n`
  );

  await writeFile(
    path.join(projectPath, 'tsconfig.json'),
    `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`
  );

  const indexContent = answers.type === "Library" 
    ? `// ${answers.projectName}
// ${answers.description}

export const version = "0.0.1";
`
    : `#!/usr/bin/env bun
// ${answers.projectName}
// ${answers.description}

console.log('Hello from ${answers.projectName}!');
`;

  await writeFile(
    path.join(srcPath, 'index.ts'),
    indexContent
  );
}

/**
 * Generate package.json file
 * @param projectPath Path where the project should be created
 * @param config Project configuration
 */
export async function generatePackageJson(projectPath: string, config: {
  name: string;
  description: string;
  author: string;
  type: string;
}) {
  const packageJson = {
    name: config.name,
    version: "0.0.1", 
    description: config.description,
    type: "module",
    scripts: config.type === "Library" ? {
      "dev": "bun run src/index.ts",
      "build": `bun run build:${config.name} && bun run build:types`,
      [`build:${config.name}`]: "bun build src/index.ts --outfile dist/index.js --minify --target=browser",
      "build:types": "tsc --declaration --emitDeclarationOnly --outDir dist",
      "publish": "bun run build && npm publish --access public"
    } : {
      build: "bun build ./src/index.ts --outdir ./dist --target node",
      dev: "bun run src/index.ts",
      test: "bun test"
    },
    bin: config.type === "library" ? undefined : {
      [config.name]: "./dist/index.js"
    },
    devDependencies: {
      "@types/bun": "latest"
    },
    peerDependencies: {
      "typescript": "^5.0.0"
    },
    types: "dist/index.d.ts",
    files: [
      "dist"
    ],
    repository: {
      type: "git",
      url: `https://github.com/${config.author}/${config.name}`
    },
    author: config.author,
    license: "MIT",
    keywords: [
      config.name,
    ]
  }

  await writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}