# VotingChain

VotingChain is a decentralized voting system based on Ethereum blockchain. It is designed to provide a secure, 
transparent, and tamper-proof voting system for various scenarios. MIT License.

> This project also comes with a version having backend and database. It is available at branch `master`.

## Features

- **Candidate Based Voting**: Voters can vote for their favorite candidates who have been registered in the vote session.
- **RawText Based Voting**: Voters can vote for their favorite raw text options.
- **Multiple Voting Sessions**: The system supports multiple voting sessions, each with its own candidates and options.
- **Secure and Transparent**: The voting results are stored on the Ethereum blockchain, which is secure and tamper-proof.
- **ERC-721 Based Voting Token**: Using ERC-721 tokens to represent the voting rights of voters.
- **Multi-user Support**: The system supports multiple users, each with their own Ethereum account.
- **Fully Blockchain Based**: The system is fully based on the Ethereum blockchain, which ensures the security and transparency of the voting process.
- **Self-hosted Voting Networks**: You can deploy your own voting network on the Ethereum blockchain in just one click.

<table>
  <tr>
    <td><img src="doc-images/reg_predefined_txt.png" width="400" alt="reg_predefined_txt"></td>
    <td><img src="doc-images/main_frame.png" width="600" alt="main_frame"></td>
  </tr>
  <tr>
    <td><img src="doc-images/multi_user.png" width="400" alt="multi_user"></td>
    <td><img src="doc-images/results_page.png" width="400" alt="results_page"></td>
  </tr>
</table>

## Installation

### Prerequisites

You need to have the following tools installed on your machine:

- Node.js (Preferred version: 18.20.7)
- npm (Preferred version: 10.8.2)
- solc@0.8.1

To test the project, you are recommended to install the following tools:

- Ganache
- MetaMask

### Build From Source

```bash
git clone https://github.com/AdemJensen/VotingChain
cd contracts
make all

cd ../frontend
npm install
```

The `make all` in `contracts` directory will build the Solidity smart contract source code, and generate artifacts for the frontend.

## Development Run

In this section, we will introduce how to run the project on Ganache.

1. Create a new test network, get its `RPC Host` (Usually `http://127.0.0.1:7545`) and `Chain ID` (Usually `1337`, 
note that it is not `Network ID`), configure them in your MetaMask.
2. Run command to start:

```bash
cd frontend
npm run dev
```

You should see the frontend up and running. If so, open your browser, and access `http://localhost:5173/init`.

Follow the instructions on the webpage, you can choose to create a new Voting Network, or join an existing network if 
you have the manager contract address.

<img src="doc-images/sys_init.png" width="600" alt="sys_init">

## Known Issues

### Invalid Opcode

If you encounter the following error when deploying the contract:

```
Error: Returned error: VM Exception while processing transaction: invalid opcode
```

Please make sure you are using solcjs@0.8.1 to compile the contract:

```bash
npm install -g solc@0.8.1
```

If you are using MacOS, please do not use the `solc` installed by brew, it will cause the invalid opcode in the 
compiled artifact, making it impossible to deploy in Ganache.
