---
title: Getting Started
description: Quick start guide for 0G development
sidebar_position: 1
---

# Getting Started

Welcome to the 0G documentation. Follow these steps to start building.

## Install the SDK

```bash
npm install @0gfoundation/0g-ts-sdk
```

```bash
go get github.com/0gfoundation/0g-storage-client
```

## Connect to Testnet

Use the testnet RPC endpoint to connect:

```typescript
import { createClient } from "@0gfoundation/0g-ts-sdk";

const client = createClient({
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  chainId: 16600,
});
```
