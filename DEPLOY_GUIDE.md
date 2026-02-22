# 🚀 GitHub + Vercel + BSC Deployment Guide

## Step 1: Create GitHub Repo

Since GitHub CLI isn't installed, do it manually:

1. Go to **https://github.com/new**
2. Repo name: `el-continente-del-millon`
3. Privacy: **Public** (o Private, tú decides)
4. **NO** inicialices con README (ya lo tenemos)
5. Click **Create repository**
6. Copia la URL del repo (ej: `https://github.com/TU_USUARIO/el-continente-del-millon.git`)

Then run these commands in terminal:
```bash
cd C:\Users\PABLO\Desktop\TheContinent
git remote add origin https://github.com/TU_USUARIO/el-continente-del-millon.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to **https://vercel.com** → Sign in con GitHub
2. Click **Import Project** → Selecciona `el-continente-del-millon`
3. Framework: **Next.js** (auto-detected)
4. **Environment Variables**: Add `NEXT_PUBLIC_CONTRACT_ADDRESS` (dejar vacío por ahora)
5. Click **Deploy**
6. Tu URL será algo como: `https://el-continente-del-millon.vercel.app`

## Step 3: Deploy Smart Contract to BSC Testnet

### Requisitos:
- MetaMask con BSC Testnet configurado
- BNB de prueba gratuito: https://testnet.bnbchain.org/faucet-smart

### Deployar via Remix (GRATIS):
1. Ve a **https://remix.ethereum.org**
2. Crea un archivo `ContinenteDelMillon.sol`
3. Pega el contenido de `contracts/ContinenteDelMillon.sol`
4. Compila con Solidity 0.8.20+
5. En "Deploy":
   - Environment: **Injected Provider (MetaMask)**
   - Asegúrate de que MetaMask está en **BSC Testnet**
   - Click **Deploy**
6. Copia la dirección del contrato desplegado
7. Pégala en Vercel → Settings → Environment Variables → `NEXT_PUBLIC_CONTRACT_ADDRESS`
8. Redeploy en Vercel

### Deployar via Hardhat (Profesional):
Si prefieres usar la terminal:
1. Pega tu `PRIVATE_KEY` en `.env.local`
2. Ejecuta:
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```
3. Copia la dirección y ponla en Vercel.

### OpenZeppelin en Remix:
Remix importa automáticamente `@openzeppelin/contracts` si usas la URL directa.
