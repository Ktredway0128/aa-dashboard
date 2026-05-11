# ACCOUNT ABSTRACTION DASHBOARD

[![Deployed on Sepolia](https://img.shields.io/badge/Etherscan-Verified-brightgreen)](https://sepolia.etherscan.io/address/0x645B6109ac481A3CD718de39EAD349B3133F6665#code)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/Built%20with-React-blue)
![Ethers.js](https://img.shields.io/badge/Ethers.js-5.8-purple)
![Viem](https://img.shields.io/badge/Viem-2.x-orange)
![Permissionless](https://img.shields.io/badge/Permissionless.js-0.3-blue)

Built by [Tredway Development](https://tredwaydev.com) — professional Solidity smart contract packages for Web3 companies.

A production-ready React dashboard demonstrating ERC-4337 Account Abstraction. Users can deploy a Smart Account, then send ERC-20 tokens without ever paying gas. Gas is sponsored by a Paymaster — the user only signs a UserOperation.

> ⚠️ This dashboard connects to contracts deployed on Sepolia testnet. A full security audit is strongly recommended before any mainnet deployment.

---

## LIVE DEMO

[aa-dashboard.netlify.app](https://account-abstraction-dashboard.netlify.app)

---

## HOW IT WORKS

1. Connect your MetaMask wallet on Sepolia
2. The dashboard predicts your Smart Account address — deterministic, calculated from your wallet before deployment
3. Deploy your Smart Account on-chain with one click
4. Send STK tokens gaslessly — a Bundler submits the UserOperation, the Paymaster sponsors the gas
5. Your ETH balance never changes

---

## KEY CONCEPTS

**Smart Account** — A contract wallet deployed on-chain, tied to your EOA. Unlike a regular wallet which is just a private key, a Smart Account is code — enabling custom execution rules, gasless transactions, and more.

**UserOperation** — Instead of a transaction, you sign a UserOperation. A Bundler picks it up and submits it to the EntryPoint on your behalf.

**EntryPoint** — The canonical ERC-4337 contract on Ethereum that orchestrates everything. It verifies signatures, validates the Paymaster, and executes the operation atomically.

**Paymaster** — A contract that holds a gas fund. A developer or company deposits ETH into the EntryPoint on behalf of the Paymaster, which then sponsors gas for users automatically.

**Bundler** — A service that receives UserOperations and submits them to the EntryPoint. This dashboard uses Pimlico as the Bundler.

---

## DEPLOYED CONTRACTS

| Contract | Address | Etherscan |
|----------|---------|-----------|
| SmartAccountFactory | 0x645B6109ac481A3CD718de39EAD349B3133F6665 | [View](https://sepolia.etherscan.io/address/0x645B6109ac481A3CD718de39EAD349B3133F6665#code) |
| Paymaster | 0x3650103302EC76afBA9BB10FdA71601648003655 | [View](https://sepolia.etherscan.io/address/0x3650103302EC76afBA9BB10FdA71601648003655#code) |
| SmartAccount (demo) | 0x54ce6C696A396AF6b33Ec99B7B7DBF5d5cA19De3 | [View](https://sepolia.etherscan.io/address/0x54ce6C696A396AF6b33Ec99B7B7DBF5d5cA19De3#code) |
| EntryPoint (canonical) | 0x0000000071727De22E5E9d8BAf0edAc6f37da032 | [View](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032#code) |

---

## TECH STACK

![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?style=flat&logo=solidity)
![Hardhat](https://img.shields.io/badge/Hardhat-yellow?style=flat)
![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-v5-4A90E2?style=flat)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Ethers.js](https://img.shields.io/badge/Ethers.js-5.8-purple?style=flat)
![Viem](https://img.shields.io/badge/Viem-2.x-orange?style=flat)
![Permissionless.js](https://img.shields.io/badge/Permissionless.js-0.3-blue?style=flat)
![Pimlico](https://img.shields.io/badge/Pimlico-Bundler-363636?style=flat)
![Alchemy](https://img.shields.io/badge/Alchemy-363636?style=flat)

---

## FULL TOKEN INFRASTRUCTURE SUITE

| Contract | Dashboard | Demo |
|----------|-----------|------|
| ERC-20 Token (V1 & V2) | [Live](https://token-launch-dashboard.netlify.app) | [YouTube](https://www.youtube.com/watch?v=XKXBTWfiCdU) |
| Token Vesting | [Live](https://token-vesting-dashboard.netlify.app) | [YouTube](https://www.youtube.com/watch?v=XW1VAb4WP38) |
| Merkle Airdrop | [Live](https://token-airdrop-dashboard.netlify.app) | [YouTube](https://www.youtube.com/watch?v=83yvWdK8Jo4) |
| Token Staking | [Live](https://token-staking-dashboard.netlify.app) | [YouTube](https://www.youtube.com/watch?v=3T7Q0MnQHFE) |
| Token Crowdsale | [Live](https://token-crowdsale-dashboard.netlify.app) | [YouTube](https://www.youtube.com/watch?v=NPMMpZBW4zA) |
| Token Governance | [Live](https://token-governance-dashboard.netlify.app) | [YouTube](https://www.youtube.com/watch?v=yJ0DcujyZ8o) |
| NFT Membership | [Live](https://nft-membership-dashboard.netlify.app) | [YouTube](https://www.youtube.com/watch?v=bZO3Xs7fzys) |
| Liquidity Lock | [Live](https://token-liquidity-lock-dashboard.netlify.app) | YouTube |
| MultiSig + Treasury | [Live](https://token-multisig-dashboard.netlify.app) | YouTube |
| Account Abstraction | [Live](https://account-abstraction-dashboard.netlify.app) | YouTube |

---

## WORK WITH ME

- 🌐 [tredwaydev.com](https://tredwaydev.com)
- 💼 [Fiverr](https://fiverr.com/kyletredwaydev)
- 🐦 [Twitter](https://twitter.com/kyletredwaydev)
- 📺 [YouTube](https://www.youtube.com/@kyletredwaydev)