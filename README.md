# Electron-DI

## Mi primera app

Para crear una aplicacion con electron-di lo pirmero que tienes que hacer es instalar el paquete electron-di.

```bash
user@pc:~/ npm install electron-di
```

Importar la clase *ElectronDiFactory* y utilizar el metodo createApp() el cual recibo dos variables de configuracion que son opcionales, pero es recomendable pasarlas, como se muestra a continuación:

```typescript
import { ElectronDiFactory } from 'electron-di'
import { join } from 'path'

const app = ElectronDiFactory.createApp({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
}, (is.dev && process.env['ELECTRON_RENDERER_URL']) ? 
    { url: process.env['ELECTRON_RENDERER_URL'] } :
    { file: join(__dirname, '../renderer/index.html') }
)
```

## Modulo Global

Para declarar un modulo global se debe hacer de la siguiente manera

```typescript
@Global()
@Module({...})
export default class GlobalModule {}
```

Nota: A la hora de exportar proveedores, se establecen en el arreglo de exportaciones del modulo donde se encuentra
Nota: Se pueden reexportar proveedores, por ejemplo, en un modulo A exportas el proveedor P1 y en un modulo B importas el modulo A y puedes exportar el mismo proveedor P1.
Nota: En el caso si se imprtan varios modulos con que exporten el proveedor P1, a la hora de resolver o exportar este proveedor, se toma el primero del modulo que lo exporte, lo mismo pasa con los modulos globales.
