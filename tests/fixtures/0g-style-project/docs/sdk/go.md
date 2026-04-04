---
title: Go Storage Client
description: Using the 0G Go Storage Client
sidebar_position: 2
---

# Go Storage Client

## Installation

```bash
go get github.com/0gfoundation/0g-storage-client@v1.0.0
```

## Usage

```go
package main

import (
    "fmt"
    storage "github.com/0gfoundation/0g-storage-client"
)

func main() {
    client := storage.NewClient("https://evmrpc-testnet.0g.ai")
    fmt.Println(client.Version())
}
```
