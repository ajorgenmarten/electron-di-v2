import { app, BrowserWindow, BrowserWindowConstructorOptions, shell } from "electron";
import { Class } from "../types/types";
import { Container } from "./container";

type LoadOptions = {
  url?: string,
  file?: string
}

class Application {
  private container: Container = new Container()
  constructor(
    private windowOptions: BrowserWindowConstructorOptions,
    private loadOptions: LoadOptions,
  ) {}

  private createWindow() {
    const win = new BrowserWindow(this.windowOptions);
    win.on('ready-to-show', () => win.show());
    win.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' }
    });
    if (this.loadOptions.file)
      win.loadFile(this.loadOptions.file)
    else if (this.loadOptions.url)
      win.loadURL(this.loadOptions.url)
    else throw new Error('Need provide a url o file path to load ui.')
  }

  public start(module: Class) {
    this.container.register(module, []);

    app.whenReady().then(() => {
      this.createWindow();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) this.createWindow()
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform != 'darwin') app.quit()
    })
  }

  public useGlobalInterceptors() {}

  public useGlobalFilters() {}

  public useGlobalGuards() {}
}

const defaultWindowOptions: BrowserWindowConstructorOptions = {
  width: 900,
  height: 670,
  minHeight: 600,
  minWidth: 800,
  show: false,
  autoHideMenuBar: true,
  webPreferences: {
    preload: './preload/index.js',
    sandbox: false
  }
}

const defaultLoadOptions: LoadOptions = {
  file: 'index.html'
}

export default class ElectronDI {
  static createApp(
    windowOptions: BrowserWindowConstructorOptions = defaultWindowOptions,
    loadOptions: LoadOptions = defaultLoadOptions
  ) {
    return new Application(windowOptions, loadOptions)
  }
}
