const fs = require('fs');

const workerPath = 'src/workers/exportWorker.ts';
let workerCode = fs.readFileSync(workerPath, 'utf8');

workerCode = workerCode.replace(
  "else if (type === 'DOWNLOAD_TXT' || type === 'DOWNLOAD_MD') {",
  "else if (type === 'DOWNLOAD_TXT_CHUNKED' || type === 'DOWNLOAD_MD_CHUNKED') {\n    const { owner, repo, files, port } = payload;\n    const isMd = type === 'DOWNLOAD_MD_CHUNKED';\n    \n    (async () => {\n      if (isMd) {\n        port.postMessage(new TextEncoder().encode(`# Repository Export: ${owner}/${repo}\\n\\n`));\n      }\n      for (const file of files) {\n        if (isBinary(file.path)) continue;\n        const content = await localforage.getItem(`export:${owner}/${repo}:${file.path}`);\n        if (content !== null) {\n          let chunk = '';\n          if (isMd) {\n             const ext = file.path.split('.').pop() || '';\n             chunk = `## \\`${file.path}\\`\\n\\n\\`\\`\\`${ext}\\n${content}\\n\\`\\`\\`\\n\\n`;\n          } else {\n             chunk = `==================================================\\nFILE: ${file.path}\\n\\n${content}\\n\\n`;\n          }\n          port.postMessage(new TextEncoder().encode(chunk));\n        }\n      }\n      port.postMessage('DONE');\n    })();\n  } else if (type === 'DOWNLOAD_TXT' || type === 'DOWNLOAD_MD') {"
);

fs.writeFileSync(workerPath, workerCode);

const modalPath = 'src/components/ExportModal.tsx';
let modalCode = fs.readFileSync(modalPath, 'utf8');

modalCode = modalCode.replace(
  "const requestDownloadTxt = () => {\n    workerRef.current?.postMessage({ type: 'DOWNLOAD_TXT', payload: { owner, repo, files: filesToExport, filename: `${owner}-${repo}-export.txt` } });\n  };",
  "const requestDownloadTxt = () => {\n    const filename = `${owner}-${repo}-export.txt`;\n    const fileStream = streamSaver.createWriteStream(filename);\n    const writer = fileStream.getWriter();\n    const channel = new MessageChannel();\n    channel.port1.onmessage = async (e) => {\n      if (e.data === 'DONE') {\n        writer.close();\n        channel.port1.close();\n      } else {\n        await writer.write(e.data);\n      }\n    };\n    workerRef.current?.postMessage({ type: 'DOWNLOAD_TXT_CHUNKED', payload: { owner, repo, files: filesToExport, port: channel.port2 } }, [channel.port2]);\n  };"
);

modalCode = modalCode.replace(
  "const requestDownloadMd = () => {\n    workerRef.current?.postMessage({ type: 'DOWNLOAD_MD', payload: { owner, repo, files: filesToExport, filename: `${owner}-${repo}-export.md` } });\n  };",
  "const requestDownloadMd = () => {\n    const filename = `${owner}-${repo}-export.md`;\n    const fileStream = streamSaver.createWriteStream(filename);\n    const writer = fileStream.getWriter();\n    const channel = new MessageChannel();\n    channel.port1.onmessage = async (e) => {\n      if (e.data === 'DONE') {\n        writer.close();\n        channel.port1.close();\n      } else {\n        await writer.write(e.data);\n      }\n    };\n    workerRef.current?.postMessage({ type: 'DOWNLOAD_MD_CHUNKED', payload: { owner, repo, files: filesToExport, port: channel.port2 } }, [channel.port2]);\n  };"
);

fs.writeFileSync(modalPath, modalCode);
console.log('patched');
