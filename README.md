# Music DApp

This project was built to enable decentralized streaming, buying, and reselling of songs using blockchain technology. The app is powered by React for the frontend and Hardhat for managing smart contracts.

## Available Scripts

In the project directory, you can run the following commands:

### `npx hardhat clean`

Cleans the build artifacts from previous compilations, ensuring a fresh start.

### `npx hardhat compile`

Compiles the smart contracts to generate necessary artifacts for deployment and interaction.

### `npx hardhat node`

Starts a local blockchain for testing, providing accounts and private keys to simulate a blockchain environment.

### `npm run deploy`

Deploys the smart contracts to the local blockchain started by `npx hardhat node`.  
Make sure to run this in a new terminal.

### `npm start`

Runs the React app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## Using the DApp

1. **Connect MetaMask**  
   - Open the app in your browser and connect your MetaMask wallet.  
   - Use one of the accounts listed in the terminal from the `npx hardhat node` command, except for the first account (used for deploying the contract).

2. **Stream Songs**  
   - Play and stream songs available in the DApp.

3. **Buy and Resell Songs**  
   - Purchase songs as NFTs using your connected wallet.  
   - Resell NFTs via the built-in marketplace.

4. **Refresh the Page**  
   - Refresh your browser if the data does not update immediately.

---

## Future Enhancements

- Integrating stream tracking and earnings analytics.  
- Automating revenue sharing for NFT owners via smart contracts.  
- Scaling the app by supporting multiple blockchain networks to reduce fees and expand user accessibility.

Enjoy the Music DApp! 🎵
