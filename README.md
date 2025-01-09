一方云剪是一款不依赖服务器服务的视频剪辑站点，通过整合@hughfenghen作者的WebAV、opfs-tools，添加一些必要的剪辑功能，希望能给相关开发者更多的帮助和启发。

## 项目地址

[https://github.com/caohongz/yifang-clip](https://github.com/caohongz/yifang-clip)

## 项目预览

[https://caohongz.github.io/yifang-clip/](https://caohongz.github.io/yifang-clip/)

## 注意事项

1. 浏览器兼容性
   - 仅支持本地部署或HTTPS协议
   - 仅支持 Chrome 94+和 Edge 94+ 版本
   - 建议使用最新版 Chrome或 Edge 以获得最佳体验

2. 存储限制
   - 使用 IndexedDB 存储项目数据
   - 使用 OPFS (Origin Private File System) 存储媒体文件
   - 注意浏览器存储空间限制

3. 性能考虑
   - 建议处理 1080p 以下视频
   - 长视频处理可能需要较长时间
   - 导出时占用资源较多,请耐心等待

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- WebCodecs API
- WebAV
- IndexedDB
- Tailwind CSS

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 致谢

- [@hughfenghen/WebAV](https://github.com/bilibili/WebAV)
- [@hughfenghen/opfs-tools](https://github.com/hughfenghen/opfs-tools)

## License

MIT License - 详见 [LICENSE](LICENSE) 文件

