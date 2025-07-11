# fHEVM 开发环境设置指南

## 环境变量配置

要部署到Sepolia测试网，您需要设置以下环境变量：

### 1. 创建 .env 文件

在项目根目录创建 `.env` 文件，包含以下内容：

```bash
# 钱包助记词 - 请替换为您自己的助记词
MNEMONIC="your twelve word mnemonic here"

# Infura API密钥 - 请替换为您自己的Infura API密钥
INFURA_API_KEY="your_infura_api_key_here"

# Etherscan API密钥 - 用于验证合约
ETHERSCAN_API_KEY="your_etherscan_api_key_here"

# 可选：启用Gas报告
REPORT_GAS=true
```

### 2. 获取必要的API密钥

#### Infura API密钥

1. 访问 [Infura](https://infura.io/)
2. 注册账户并创建新项目
3. 复制项目的API密钥

#### Etherscan API密钥

1. 访问 [Etherscan](https://etherscan.io/)
2. 注册账户并登录
3. 在API-KEYs页面创建新的API密钥

### 3. 获取Sepolia测试网ETH

1. 访问 [Sepolia Faucet](https://sepoliafaucet.com/)
2. 输入您的钱包地址
3. 获取测试网ETH

## 部署步骤

1. 设置环境变量后，运行以下命令部署到Sepolia：

```bash
npx hardhat deploy --network sepolia
```

2. 验证合约（可选）：

```bash
npx hardhat verify --network sepolia <合约地址>
```

## 测试

- 本地测试：`npm test`
- 编译合约：`npm run compile`
- 清理构建：`npm run clean`
