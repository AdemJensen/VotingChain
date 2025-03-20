注意需要使用 solcjs@0.8.1 来进行编译：

```bash
npm install -g solc@0.8.1
```

如果您是 MacOS 系统，请不要使用 brew 安装的 solc，它将导致编译产物中包含 invalid opcode, 致使其无法在 Ganache 中部署。