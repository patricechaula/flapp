const electronInstaller = require('electron-winstaller');

async function buildInstaller()
{
    await electronInstaller.createWindowsInstaller({
        appDirectory: './flapp-win32-ia32',
        outputDirectory: './installer32',
        authors: 'Summerplace Natural Resources PL',
        exe: 'flapp.exe',
        description: 'Fertiliser and lime recommendation application'
      });
      console.log('It worked!');
}
try {
    buildInstaller();
  } catch (e) {
    console.log(`No dice: ${e.message}`);
  }