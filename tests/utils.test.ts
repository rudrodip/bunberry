import { expect, test, describe, beforeEach, afterEach, mock } from 'bun:test';
import { checkBun, createProjectFolder, generateProjectFiles, generatePackageJson } from '../src/utils';
import { mkdir, writeFile } from 'fs/promises';

mock.module('fs/promises', () => ({
  mkdir: mock(() => Promise.resolve()),
  writeFile: mock(() => Promise.resolve())
}));

describe('utils.ts', () => {
  describe('checkBun', () => {
    let originalBunWhich: typeof Bun.which;

    beforeEach(() => {
      originalBunWhich = Bun.which;
    });

    afterEach(() => {
      // @ts-ignore: Restore original function
      Bun.which = originalBunWhich;
    });

    test('returns true when bun is available', () => {
      // @ts-ignore: Mock which
      Bun.which = () => '/usr/local/bin/bun';
      expect(checkBun()).toBe(true);
    });

    test('returns false when bun is not available', () => {
      // @ts-ignore: Mock which
      Bun.which = () => null;
      expect(checkBun()).toBe(false);
    });
  });

  describe('createProjectFolder', () => {
    beforeEach(() => {
      mock.module('fs/promises', () => ({
        mkdir: mock(() => Promise.resolve()),
        writeFile: mock(() => Promise.resolve())
      }));
    });

    test('creates folder successfully', async () => {
      const mkdirMock = mkdir as unknown as ReturnType<typeof mock>;
      mkdirMock.mockImplementation(() => Promise.resolve());

      await createProjectFolder('/test/path');
      expect(mkdirMock).toHaveBeenCalledWith('/test/path');
    });

    test('throws error if folder already exists', async () => {
      const error = new Error('Folder exists');
      // @ts-ignore: Mocking NodeJS.ErrnoException
      error.code = 'EEXIST';
      
      const mkdirMock = mkdir as unknown as ReturnType<typeof mock>;
      mkdirMock.mockImplementation(() => Promise.reject(error));

      await expect(createProjectFolder('/test/path')).rejects.toThrow('Project folder "path" already exists');
    });

    test('propagates other errors', async () => {
      const error = new Error('Other error');
      
      const mkdirMock = mkdir as unknown as ReturnType<typeof mock>;
      mkdirMock.mockImplementation(() => Promise.reject(error));

      await expect(createProjectFolder('/test/path')).rejects.toThrow('Other error');
    });
  });

  describe('generateProjectFiles', () => {
    beforeEach(() => {
      (mkdir as unknown as ReturnType<typeof mock>).mockReset();
      (writeFile as unknown as ReturnType<typeof mock>).mockReset();
    });

    test('creates necessary project files for Library type', async () => {
      (mkdir as unknown as ReturnType<typeof mock>).mockResolvedValue(undefined);
      (writeFile as unknown as ReturnType<typeof mock>).mockResolvedValue(undefined);

      const projectPath = '/test/project';
      const answers = {
        projectName: 'test-project',
        description: 'Test description',
        type: 'Library'
      };

      await generateProjectFiles(projectPath, answers);

      expect(mkdir).toHaveBeenCalledWith(`${projectPath}/src`);
      
      expect(writeFile).toHaveBeenCalledTimes(4); // .gitignore, README.md, tsconfig.json, src/index.ts
      
      const mockCalls = (writeFile as unknown as ReturnType<typeof mock>).mock.calls;
      const indexFileCall = mockCalls.find(
        call => call[0] === `${projectPath}/src/index.ts`
      );
      expect(indexFileCall?.[1]).toContain('// test-project');
      expect(indexFileCall?.[1]).toContain('export const version = "0.0.1";');
    });

    test('creates necessary project files for CLI type', async () => {
      (mkdir as unknown as ReturnType<typeof mock>).mockResolvedValue(undefined);
      (writeFile as unknown as ReturnType<typeof mock>).mockResolvedValue(undefined);

      const projectPath = '/test/project';
      const answers = {
        projectName: 'test-cli',
        description: 'Test CLI',
        type: 'CLI'
      };

      await generateProjectFiles(projectPath, answers);

      const mockCalls = (writeFile as unknown as ReturnType<typeof mock>).mock.calls;
      const indexFileCall = mockCalls.find(
        call => call[0] === `${projectPath}/src/index.ts`
      );
      expect(indexFileCall?.[1]).toContain('#!/usr/bin/env bun');
      expect(indexFileCall?.[1]).toContain('Hello from test-cli');
    });
  });

  describe('generatePackageJson', () => {
    beforeEach(() => {
      (writeFile as unknown as ReturnType<typeof mock>).mockReset();
    });

    test('generates package.json for Library type', async () => {
      (writeFile as unknown as ReturnType<typeof mock>).mockResolvedValue(undefined);

      const projectPath = '/test/project';
      const config = {
        name: 'test-lib',
        description: 'Test library',
        author: 'tester',
        type: 'Library'
      };

      await generatePackageJson(projectPath, config);

      expect(writeFile).toHaveBeenCalledTimes(1);
      const mockCalls = (writeFile as unknown as ReturnType<typeof mock>).mock.calls;
      const packageJsonCall = mockCalls[0];
      expect(packageJsonCall?.[0]).toBe(`${projectPath}/package.json`);
      
      const packageJsonContent = JSON.parse(packageJsonCall?.[1]);
      expect(packageJsonContent.name).toBe('test-lib');
      expect(packageJsonContent.scripts).toHaveProperty('build:test-lib');
      expect(packageJsonContent.scripts).toHaveProperty('build:types');
    });

    test('generates package.json for CLI type', async () => {
      (writeFile as unknown as ReturnType<typeof mock>).mockResolvedValue(undefined);

      const projectPath = '/test/project';
      const config = {
        name: 'test-cli',
        description: 'Test CLI',
        author: 'tester',
        type: 'CLI'
      };

      await generatePackageJson(projectPath, config);

      expect(writeFile).toHaveBeenCalledTimes(1);
      const mockCalls = (writeFile as unknown as ReturnType<typeof mock>).mock.calls;
      const packageJsonCall = mockCalls[0];
      
      const packageJsonContent = JSON.parse(packageJsonCall?.[1]);
      expect(packageJsonContent.name).toBe('test-cli');
      expect(packageJsonContent.scripts).toHaveProperty('build');
      expect(packageJsonContent.scripts).toHaveProperty('dev');
      expect(packageJsonContent.scripts).toHaveProperty('test');
      expect(packageJsonContent.bin).toHaveProperty('test-cli');
    });
  });
});