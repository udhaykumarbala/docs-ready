---
title: TypeScript SDK
description: Using the 0G TypeScript SDK
sidebar_position: 1
---

# TypeScript SDK

## Installation

```bash
npm install @0gfoundation/0g-ts-sdk@1.2.0
```

## Upload a File

```typescript
import { ZeroGStorage } from "@0gfoundation/0g-ts-sdk";

const storage = new ZeroGStorage({
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  privateKey: process.env.PRIVATE_KEY,
});

await storage.upload("./myfile.txt");
```

## Query Storage

```typescript
const files = await storage.list();
console.log(files);
```
