const fs = require('fs');

const workerPath = 'src/workers/exportWorker.ts';
let workerCode = fs.readFileSync(workerPath, 'utf8');

workerCode = workerCode.replace(
  "else if (type === 'DOWNLOAD_ZIP') {\n    const { owner, repo, files } = payload;\n    const zip = new JSZip();\n    \n    // Read all from localforage and add to zip\n    for (const file of files) {\n      if (isBinary(file.path)) continue;\n      const content = await localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`);\n      if (content !== null) {\n        zip.file(file.path, content);\n      }\n    }\n    \n    const blob = await zip.generateAsync({ type: 'blob' });\n    self.postMessage({ type: 'ZIP_READY', payload: { blob } });\n  }",
  "else if (type === 'DOWNLOAD_ZIP') {\n    const { owner, repo, files, port } = payload;\n    const zip = new JSZip();\n    \n    for (const file of files) {\n      if (isBinary(file.path)) continue;\n      const content = await localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`);\n      if (content !== null) {\n        zip.file(file.path, content);\n      }\n    }\n    \n    const stream = zip.generateInternalStream({ type: 'uint8array', streamFiles: true });\n    stream.on('data', (data) => {\n      port.postMessage(data, [data.buffer]);\n    }).on('end', () => {\n      port.postMessage('DONE');\n    }).resume();\n  }"
);

fs.writeFileSync(workerPath, workerCode);

const modalPath = 'src/components/ExportModal.tsx';
let modalCode = fs.readFileSync(modalPath, 'utf8');

modalCode = modalCode.replace(
  "const requestDownloadZip = () => {\n    workerRef.current?.postMessage({ type: 'DOWNLOAD_ZIP', payload: { owner, repo, files: filesToExport } });\n  };",
  "const requestDownloadZip = () => {\n    const filename = `${owner}-${repo}-source.zip`;\n    const fileStream = streamSaver.createWriteStream(filename);\n    const writer = fileStream.getWriter();\n    const channel = new MessageChannel();\n    channel.port1.onmessage = async (e) => {\n      if (e.data === 'DONE') {\n        writer.close();\n        channel.port1.close();\n      } else {\n        await writer.write(e.data);\n      }\n    };\n    workerRef.current?.postMessage({ type: 'DOWNLOAD_ZIP', payload: { owner, repo, files: filesToExport, port: channel.port2 } }, [channel.port2]);\n  };"
);

fs.writeFileSync(modalPath, modalCode);
console.log('patched zip');
