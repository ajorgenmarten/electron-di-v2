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
@Global({
  imports: [...],
  providers: [...]
})
export default class GlobalModule {}
```

Nota: Cuando un modulo es global por defecto todos sus providers son exportados
