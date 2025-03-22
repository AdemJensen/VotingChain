const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, "../contracts_build");
const outputDir = path.join(__dirname, "../../frontend/src/artifacts");

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(buildDir);

// 获取所有 .abi 文件
const abiFiles = files.filter(f => f.endsWith(".abi"));

abiFiles.forEach(abiFile => {
    const name = abiFile.replace(".abi", "");
    const binFile = name + ".bin";

    const abiPath = path.join(buildDir, abiFile);
    const binPath = path.join(buildDir, binFile);

    // 检查 bin 是否存在
    if (!fs.existsSync(binPath)) {
        console.warn(`⚠️ 找不到对应的 .bin 文件: ${binFile}，跳过 ${name}`);
        return;
    }

    const abi = fs.readFileSync(abiPath, "utf8");
    const bin = fs.readFileSync(binPath, "utf8");

    const output = {
        abi: JSON.parse(abi),
        bytecode: "0x" + bin
    };

    const outputPath = path.join(outputDir, `${name}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ 生成 ${name}.json`);
});