import { describe, test, expect, afterEach, spyOn, mock } from 'bun:test';
import * as utils from '../src/utils';

describe('Bunberry CLI Integration Tests', () => {
  afterEach(() => {
    mock.restore();
  });

  test('should detect Bun installation correctly', () => {
    const originalWhich = Bun.which;
    
    Bun.which = (cmd: string) => cmd === 'bun' ? '/usr/bin/bun' : null;
    expect(utils.checkBun()).toBe(true);
    
    Bun.which = () => null;
    expect(utils.checkBun()).toBe(false);
    
    Bun.which = originalWhich;
  });

  test('utils.createProjectFolder should handle existing folders', async () => {
    const mockMkdir = spyOn((await import('fs/promises')), 'mkdir');
    
    mockMkdir.mockImplementation(async () => undefined as any);
    await utils.createProjectFolder('/fake/path');
    expect(mockMkdir).toHaveBeenCalled();
    
    const error: any = new Error('EEXIST');
    error.code = 'EEXIST';
    mockMkdir.mockImplementation(async () => { throw error });
    
    try {
      await utils.createProjectFolder('/fake/path');
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toContain('already exists');
    }
  });

  test('utils.generateProjectFiles should create correct files', async () => {
    const fs = await import('fs/promises');
    const mockWriteFile = spyOn(fs, 'writeFile').mockImplementation(async () => undefined as any);
    const mockMkdir = spyOn(fs, 'mkdir').mockImplementation(async () => undefined as any);
    
    const projectPath = '/fake/project/path';
    const answers = {
      projectName: 'test-project',
      description: 'Test description',
      author: 'test-author',
      type: 'Library'
    };
    
    await utils.generateProjectFiles(projectPath, answers);
    
    expect(mockMkdir).toHaveBeenCalled();
  });

  test('utils.generatePackageJson should generate correct package.json', async () => {
    const writeFileMock = spyOn((await import('fs/promises')), 'writeFile')
      .mockImplementation(async (_, content) => {
        const json = JSON.parse(content as string);
        expect(json.name).toBe('test-project');
        expect(json.description).toBe('Test description');
        expect(json.author).toBe('test-author');
        return undefined as any;
      });
    
    await utils.generatePackageJson('/fake/path', {
      name: 'test-project',
      description: 'Test description',
      author: 'test-author',
      type: 'Library'
    });
    
    expect(writeFileMock).toHaveBeenCalled();
  });
}); 