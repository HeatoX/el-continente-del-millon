const hre = require("hardhat");

async function main() {
    console.log("Desplegando contrato en:", hre.network.name);

    const Continente = await hre.ethers.deployContract("ContinenteDelMillon");

    await Continente.waitForDeployment();

    console.log(
        `El Continente del Millón desplegado en: ${await Continente.getAddress()}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
