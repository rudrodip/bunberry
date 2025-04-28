#!/usr/bin/env bun
import { Command } from 'commander';
import inquirer from 'inquirer';
import { checkBun, createProjectFolder, generateProjectFiles, generatePackageJson } from './utils';
import path from 'path';

const program = new Command();

program
  .name('bunberry')
  .description('Build and publish your Bun project with ease')
  .argument('[folderName]', 'Name of the project folder')
  .action(async (folderName?: string) => {

    if (!checkBun()) {
      console.error('❌ Bun is not installed.');
      const { shouldInstall } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldInstall',
          message: 'Would you like to install Bun now?',
          default: true
        }
      ]);

      if (shouldInstall) {
        console.log('Installing Bun...');
        const installProcess = Bun.spawn(['npm', 'install', '-g', 'bun'], {
          stdio: ['inherit', 'inherit', 'inherit']
        });
        await installProcess.exited;
      } else {
        console.log('Please install Bun first: npm install -g bun');
        process.exit(1);
      }
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project Name:',
        default: folderName || 'bunberry',
        when: () => !folderName
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author Name:',
      },
      {
        type: 'list',
        name: 'type',
        message: 'Project Type:',
        choices: ['Library', 'CLI'],
        default: 'Library'
      }
    ]);

    const projectName = folderName || answers.projectName;
    const projectPath = path.join(process.cwd(), projectName);

    try {
      await createProjectFolder(projectPath);

      await generateProjectFiles(projectPath, answers);

      await generatePackageJson(projectPath, {
        name: projectName,
        description: answers.description,
        author: answers.author,
        type: answers.type,
      });

      console.log('📦 Installing dependencies...');
      const installProcess = Bun.spawn(['bun', 'install'], {
        cwd: projectPath,
        stdio: ['inherit', 'inherit', 'inherit']
      });
      await installProcess.exited;

      console.log('\n✨ Project created successfully!');
      console.log('\nNext steps:');
      console.log(`  cd ${projectName}`);
      console.log('  bun run dev');
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Error:', error.message);
      } else {
        console.error('❌ Error:', String(error));
      }
      process.exit(1);
    }
  });

program.parse();
