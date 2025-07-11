import { ethers } from "hardhat";

async function main() {
  console.log("开始部署FHECounter合约到Sepolia...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", await deployer.getAddress());

  // 部署FHECounter合约
  console.log("\n部署FHECounter合约...");
  const FHECounter = await ethers.getContractFactory("FHECounter");
  const fheCounter = await FHECounter.deploy();
  await fheCounter.waitForDeployment();
  const fheCounterAddress = await fheCounter.getAddress();

  console.log("✅ FHECounter合约部署成功！");
  console.log("合约地址:", fheCounterAddress);
  console.log("Etherscan链接: https://sepolia.etherscan.io/address/" + fheCounterAddress);

  console.log("\n📝 下一步：");
  console.log("1. 验证合约: npx hardhat verify --network sepolia " + fheCounterAddress);
  console.log("2. 在Etherscan上查看合约");
  console.log("3. 测试合约功能");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });
